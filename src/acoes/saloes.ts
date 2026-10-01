"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ErroDeAutorizacao, ErroDeConflito, ErroDeValidacao } from "@/services/erros";
import { atualizarHorarios, criarSalao } from "@/services/saloes/saloes.service";

export type EstadoFormularioSalao = {
  mensagem?: string;
  erros?: Record<string, string[]>;
  sucesso?: boolean;
};

const DIAS_SEMANA = ["DOMINGO", "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"] as const;

/** Reconstrói o array de horários a partir dos campos nomeados `horarios[DIA][campo]`. */
function horariosDe(formData: FormData) {
  return DIAS_SEMANA.map((diaSemana) => ({
    diaSemana,
    horaAbertura: String(formData.get(`horarios[${diaSemana}][horaAbertura]`) ?? ""),
    horaFechamento: String(formData.get(`horarios[${diaSemana}][horaFechamento]`) ?? ""),
    ativo: formData.get(`horarios[${diaSemana}][ativo]`) === "on",
  }));
}

export async function criarSalaoAction(
  _estado: EstadoFormularioSalao,
  formData: FormData,
): Promise<EstadoFormularioSalao> {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const dados = {
    nome: formData.get("nome"),
    endereco: formData.get("endereco"),
    telefone: formData.get("telefone"),
    horarios: horariosDe(formData),
  };

  try {
    await criarSalao(sessao.user.id, dados);
  } catch (erro) {
    if (erro instanceof ErroDeValidacao) return { erros: erro.erros };
    if (erro instanceof ErroDeConflito) return { mensagem: erro.message };

    console.error("Falha ao criar salão:", erro);
    return { mensagem: "Não foi possível criar o salão. Tente novamente." };
  }

  redirect("/salao/meu/servicos");
}

export async function atualizarHorariosAction(
  _estado: EstadoFormularioSalao,
  formData: FormData,
): Promise<EstadoFormularioSalao> {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const salaoId = String(formData.get("salaoId"));

  try {
    await atualizarHorarios(sessao.user.id, salaoId, { horarios: horariosDe(formData) });
  } catch (erro) {
    if (erro instanceof ErroDeValidacao) return { erros: erro.erros };
    if (erro instanceof ErroDeAutorizacao) return { mensagem: erro.message };

    console.error("Falha ao atualizar horários:", erro);
    return { mensagem: "Não foi possível salvar os horários. Tente novamente." };
  }

  revalidatePath("/salao/meu/horarios");
  return { sucesso: true };
}
