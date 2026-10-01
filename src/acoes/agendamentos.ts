"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { criarAgendamento } from "@/services/agendamentos/agendamentos.service";
import { ErroDeConflito, ErroDeValidacao } from "@/services/erros";

export type EstadoAgendamento = {
  mensagem?: string;
};

export async function criarAgendamentoAction(
  _estado: EstadoAgendamento,
  formData: FormData,
): Promise<EstadoAgendamento> {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const salaoId = String(formData.get("salaoId"));
  const servicoId = String(formData.get("servicoId"));
  const dataHora = String(formData.get("dataHora"));

  let agendamentoId: string;
  try {
    const agendamento = await criarAgendamento(sessao.user.id, { salaoId, servicoId, dataHora });
    agendamentoId = agendamento.id;
  } catch (erro) {
    if (erro instanceof ErroDeValidacao) return { mensagem: "Dados do agendamento inválidos. Volte e tente novamente." };
    if (erro instanceof ErroDeConflito) return { mensagem: erro.message };

    console.error("Falha ao criar agendamento:", erro);
    return { mensagem: "Não foi possível confirmar o agendamento. Tente novamente." };
  }

  redirect(`/salao/${salaoId}/agendar/sucesso?agendamentoId=${agendamentoId}`);
}
