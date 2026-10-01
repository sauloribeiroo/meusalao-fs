"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { criarAgendamento } from "@/services/agendamentos/agendamentos.service";
import { ErroDeNegocio, ErroDeValidacao } from "@/services/erros";

/** RF16 — confirmação do agendamento na tela de revisão. */

export type EstadoAgendamento = {
  mensagem?: string;
};

export async function agendarAction(
  _estado: EstadoAgendamento,
  formData: FormData,
): Promise<EstadoAgendamento> {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const salaoId = String(formData.get("salaoId") ?? "");
  let agendamentoId: string;

  try {
    const agendamento = await criarAgendamento(sessao.user.id, {
      salaoId,
      servicoId: formData.get("servicoId"),
      // Instante ISO vindo do slot — nunca remontado a partir de data + hora,
      // para não depender do fuso de quem está executando.
      dataHora: formData.get("dataHora"),
    });
    agendamentoId = agendamento.id;
  } catch (erro) {
    if (erro instanceof ErroDeValidacao) {
      return { mensagem: "Dados do agendamento inválidos. Volte e escolha o horário novamente." };
    }
    // Horário ocupado, fora do funcionamento, no passado: a mensagem do
    // serviço já está escrita para o usuário final.
    if (erro instanceof ErroDeNegocio) return { mensagem: erro.message };

    console.error("Falha ao agendar:", erro);
    return { mensagem: "Não foi possível confirmar o agendamento. Tente novamente." };
  }

  // Fora do try: redirect() sinaliza o desvio lançando um erro.
  redirect(`/salao/${salaoId}/agendar/sucesso?agendamento=${agendamentoId}`);
}
