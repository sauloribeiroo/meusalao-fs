"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { cancelarAgendamentoDoCliente } from "@/services/agendamentos/agendamentos.service";
import { criarAvaliacao } from "@/services/avaliacoes/avaliacoes.service";
import { ErroDeNegocio, ErroDeValidacao } from "@/services/erros";

/** RF18 e RF19 — ações do cliente sobre os próprios agendamentos. */

export type EstadoDoCliente = {
  mensagem?: string;
  erros?: Record<string, string[]>;
  /** Instante da última ação concluída, para a UI reagir a repetições. */
  feitoEm?: number;
};

/** RF18 — cancelar o próprio agendamento (RGN04). */
export async function cancelarAgendamentoAction(
  _estado: EstadoDoCliente,
  formData: FormData,
): Promise<EstadoDoCliente> {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const agendamentoId = String(formData.get("agendamentoId") ?? "");

  try {
    await cancelarAgendamentoDoCliente(sessao.user.id, agendamentoId);
  } catch (erro) {
    // "Não é possível cancelar um agendamento concluído" já vem do serviço.
    if (erro instanceof ErroDeNegocio) return { mensagem: erro.message };

    console.error("Falha ao cancelar agendamento:", erro);
    return { mensagem: "Não foi possível cancelar. Tente novamente." };
  }

  revalidatePath("/agendamentos");
  return { feitoEm: Date.now() };
}

/**
 * RF19 — avaliar o atendimento (RGN03).
 *
 * Em caso de sucesso redireciona, em vez de devolver estado: a tela de
 * avaliação deixa de fazer sentido depois de enviada, e o lugar da confirmação
 * é a lista. `redirect` lança por dentro, por isso fica fora do try.
 */
export async function avaliarAction(
  _estado: EstadoDoCliente,
  formData: FormData,
): Promise<EstadoDoCliente> {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const dados = {
    agendamentoId: String(formData.get("agendamentoId") ?? ""),
    nota: String(formData.get("nota") ?? ""),
    comentario: String(formData.get("comentario") ?? ""),
  };

  try {
    await criarAvaliacao(sessao.user.id, dados);
  } catch (erro) {
    if (erro instanceof ErroDeValidacao) return { erros: erro.erros };
    if (erro instanceof ErroDeNegocio) return { mensagem: erro.message };

    console.error("Falha ao avaliar atendimento:", erro);
    return { mensagem: "Não foi possível enviar a avaliação. Tente novamente." };
  }

  revalidatePath("/agendamentos");
  redirect("/agendamentos?avaliado=1");
}
