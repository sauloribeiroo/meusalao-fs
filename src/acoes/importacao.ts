"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ErroDeNegocio, ErroDeValidacao } from "@/services/erros";
import { exigirSalaoDoDono } from "@/services/saloes/saloes.service";
import {
  analisarCsvDeServicos,
  importarServicosDoCsv,
  type AnaliseDoCsv,
} from "@/services/servicos/importacao.service";

/** RF21 — importação do catálogo por CSV, em duas etapas. */

export type EstadoImportacao = {
  mensagem?: string;
  /** Pré-visualização: o que aconteceria se confirmasse. */
  analise?: AnaliseDoCsv;
  /** Conteúdo do arquivo, carregado no formulário para a etapa de confirmação. */
  csv?: string;
  /** Resultado da gravação. */
  criados?: number;
  ignorados?: number;
  feitoEm?: number;
};

async function salaoDaSessao(): Promise<string> {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");
  if (sessao.user.papel !== "DONO_SALAO" && sessao.user.papel !== "ADMIN") redirect("/inicio");

  const salao = await exigirSalaoDoDono(sessao.user.id);
  return salao.id;
}

/** Etapa 1: lê o arquivo e mostra o que entraria, sem gravar nada. */
export async function analisarCsvAction(
  _estado: EstadoImportacao,
  formData: FormData,
): Promise<EstadoImportacao> {
  const csv = String(formData.get("csv") ?? "");

  try {
    const analise = await analisarCsvDeServicos(await salaoDaSessao(), csv);
    return { analise, csv };
  } catch (erro) {
    return falha(erro, "Não foi possível ler o arquivo. Confira o formato e tente de novo.");
  }
}

/**
 * Etapa 2: grava. O arquivo é reanalisado no serviço, de propósito — entre a
 * pré-visualização e a confirmação o catálogo pode ter mudado em outra aba.
 */
export async function importarCsvAction(
  _estado: EstadoImportacao,
  formData: FormData,
): Promise<EstadoImportacao> {
  const csv = String(formData.get("csv") ?? "");

  try {
    const { criados, ignorados } = await importarServicosDoCsv(await salaoDaSessao(), csv);

    revalidatePath("/salao/meu/servicos");
    return { criados, ignorados, feitoEm: Date.now() };
  } catch (erro) {
    return falha(erro, "Não foi possível importar. Tente novamente.");
  }
}

function falha(erro: unknown, generica: string): EstadoImportacao {
  if (erro instanceof ErroDeValidacao) {
    return { mensagem: Object.values(erro.erros).flat().join(" ") || erro.message };
  }
  if (erro instanceof ErroDeNegocio) return { mensagem: erro.message };

  console.error("Falha na importação de serviços:", erro);
  return { mensagem: generica };
}
