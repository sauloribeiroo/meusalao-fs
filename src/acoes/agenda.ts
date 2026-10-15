"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { aplicarAcaoDoSalao } from "@/services/agendamentos/agendamentos.service";
import { ErroDeNegocio } from "@/services/erros";
import { exigirSalaoDoDono } from "@/services/saloes/saloes.service";

/** RF25 — confirmar, recusar ou concluir um agendamento do salão. */

export type EstadoAgenda = {
  mensagem?: string;
  /** Instante da última ação bem-sucedida, para a UI reagir a repetições. */
  feitoEm?: number;
};

export async function aplicarAcaoAction(
  _estado: EstadoAgenda,
  formData: FormData,
): Promise<EstadoAgenda> {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");
  // RGN07: só o dono do salão (ou o administrador) decide sobre os agendamentos.
  if (sessao.user.papel !== "DONO_SALAO" && sessao.user.papel !== "ADMIN") redirect("/inicio");

  const agendamentoId = String(formData.get("agendamentoId") ?? "");
  const acao = String(formData.get("acao") ?? "");

  try {
    const salao = await exigirSalaoDoDono(sessao.user.id);
    await aplicarAcaoDoSalao(salao.id, agendamentoId, { acao });
  } catch (erro) {
    // "Não é possível confirmar um agendamento cancelado" já vem pronto do serviço.
    if (erro instanceof ErroDeNegocio) return { mensagem: erro.message };

    console.error("Falha ao agir sobre o agendamento:", erro);
    return { mensagem: "Não foi possível concluir a ação. Tente novamente." };
  }

  revalidatePath("/salao/meu/agenda");
  revalidatePath(`/salao/meu/agenda/${agendamentoId}`);
  return { feitoEm: Date.now() };
}
