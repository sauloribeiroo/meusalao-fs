"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ErroDeConflito, ErroDeNegocio, ErroDeValidacao } from "@/services/erros";
import { exigirSalaoDoDono } from "@/services/saloes/saloes.service";
import { cadastrarServico, editarServico, removerServico } from "@/services/servicos/servicos.service";

/**
 * RF20 — ações da tela de serviços do salão.
 *
 * Server Actions chamam a camada de serviços direto, sem passar por HTTP: é a
 * mesma arquitetura das rotas de API (sessão → papel → Zod → serviço), só que
 * sem o salto pela rede. A API REST continua existindo para quem precisar dela
 * de fora da aplicação.
 */

export type EstadoServico = {
  mensagem?: string;
  erros?: Record<string, string[]>;
  /** O que já estava digitado, para repopular o formulário após um erro. */
  valores?: Record<string, string>;
  sucesso?: boolean;
};

const ROTA = "/salao/meu/servicos";

/** Sessão do dono e o salão dele, ou desvio para a tela adequada. */
async function salaoDoDonoLogado() {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");
  if (sessao.user.papel !== "DONO_SALAO" && sessao.user.papel !== "ADMIN") redirect("/inicio");

  return exigirSalaoDoDono(sessao.user.id);
}

const valoresDe = (formData: FormData) => ({
  nome: String(formData.get("nome") ?? ""),
  preco: String(formData.get("preco") ?? ""),
  duracaoMin: String(formData.get("duracaoMin") ?? ""),
});

export async function criarServicoAction(_estado: EstadoServico, formData: FormData): Promise<EstadoServico> {
  const salao = await salaoDoDonoLogado();
  const valores = valoresDe(formData);

  try {
    await cadastrarServico(salao.id, {
      nome: valores.nome,
      // Campo vazio é "Consultar preço" (RGN06), não zero.
      preco: valores.preco.trim() === "" ? null : valores.preco,
      duracaoMin: valores.duracaoMin,
    });
  } catch (erro) {
    return falha(erro, valores, "Não foi possível cadastrar o serviço. Tente novamente.");
  }

  revalidatePath(ROTA);
  return { sucesso: true };
}

export async function editarServicoAction(_estado: EstadoServico, formData: FormData): Promise<EstadoServico> {
  const salao = await salaoDoDonoLogado();
  const valores = valoresDe(formData);
  const servicoId = String(formData.get("servicoId") ?? "");

  try {
    await editarServico(salao.id, servicoId, {
      nome: valores.nome,
      preco: valores.preco.trim() === "" ? null : valores.preco,
      duracaoMin: valores.duracaoMin,
    });
  } catch (erro) {
    return falha(erro, valores, "Não foi possível salvar as alterações. Tente novamente.");
  }

  revalidatePath(ROTA);
  return { sucesso: true };
}

export async function removerServicoAction(_estado: EstadoServico, formData: FormData): Promise<EstadoServico> {
  const salao = await salaoDoDonoLogado();

  try {
    await removerServico(salao.id, String(formData.get("servicoId") ?? ""));
  } catch (erro) {
    return falha(erro, undefined, "Não foi possível excluir o serviço. Tente novamente.");
  }

  revalidatePath(ROTA);
  return { sucesso: true };
}

/** Traduz a exceção do serviço no estado que o formulário sabe exibir. */
function falha(erro: unknown, valores: Record<string, string> | undefined, generica: string): EstadoServico {
  if (erro instanceof ErroDeValidacao) return { valores, erros: erro.erros };
  // Conflito e "não encontrado" já trazem mensagem pronta para o usuário.
  if (erro instanceof ErroDeConflito || erro instanceof ErroDeNegocio) {
    return { valores, mensagem: erro.message };
  }

  console.error("Falha na ação de serviço:", erro);
  return { valores, mensagem: generica };
}
