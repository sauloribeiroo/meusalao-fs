"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ErroDeNegocio, ErroDeValidacao } from "@/services/erros";
import { definirHorariosDoSalao } from "@/services/horarios/horarios.service";
import { exigirSalaoDoDono } from "@/services/saloes/saloes.service";

/**
 * RF22 — grava a semana de funcionamento.
 *
 * O formulário envia os sete dias; aqui a lista é montada só com os marcados
 * como abertos, que é o formato que o serviço espera (dia ausente = fechado).
 */

export type EstadoHorarios = {
  mensagem?: string;
  erros?: Record<string, string[]>;
  sucesso?: boolean;
};

const DIAS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"] as const;

export async function salvarHorariosAction(
  _estado: EstadoHorarios,
  formData: FormData,
): Promise<EstadoHorarios> {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");
  if (sessao.user.papel !== "DONO_SALAO" && sessao.user.papel !== "ADMIN") redirect("/inicio");

  const salao = await exigirSalaoDoDono(sessao.user.id);

  const horarios = DIAS.filter((dia) => formData.get(`aberto-${dia}`) === "on").map((dia) => ({
    diaSemana: dia,
    horaAbertura: String(formData.get(`abertura-${dia}`) ?? ""),
    horaFechamento: String(formData.get(`fechamento-${dia}`) ?? ""),
    ativo: true,
  }));

  try {
    await definirHorariosDoSalao(salao.id, { horarios });
  } catch (erro) {
    if (erro instanceof ErroDeValidacao) return { erros: erro.erros };
    if (erro instanceof ErroDeNegocio) return { mensagem: erro.message };

    console.error("Falha ao salvar horários:", erro);
    return { mensagem: "Não foi possível salvar os horários. Tente novamente." };
  }

  revalidatePath("/salao/meu/horarios");
  return { sucesso: true };
}
