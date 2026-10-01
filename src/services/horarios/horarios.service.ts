import type { DiaSemana } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ErroDeValidacao } from "@/services/erros";
import { horariosDaSemanaSchema } from "@/services/horarios/schemas";

export type HorarioPublico = {
  diaSemana: DiaSemana;
  horaAbertura: string;
  horaFechamento: string;
  ativo: boolean;
};

/** Ordem de exibição: a semana começa no domingo, como no calendário. */
const ORDEM: DiaSemana[] = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

const porDiaDaSemana = (a: HorarioPublico, b: HorarioPublico) =>
  ORDEM.indexOf(a.diaSemana) - ORDEM.indexOf(b.diaSemana);

export async function listarHorariosDoSalao(salaoId: string): Promise<HorarioPublico[]> {
  const horarios = await prisma.horarioFuncionamento.findMany({
    where: { salaoId },
    select: { diaSemana: true, horaAbertura: true, horaFechamento: true, ativo: true },
  });

  return horarios.sort(porDiaDaSemana);
}

/**
 * RF22 — grava a semana inteira de uma vez, substituindo o que havia.
 *
 * Em transação: se a gravação falhar no meio, o salão não fica sem horário
 * nenhum (RNF10). Dias ausentes da lista são apagados — é assim que a tela
 * remove um dia da semana.
 */
export async function definirHorariosDoSalao(salaoId: string, dados: unknown): Promise<HorarioPublico[]> {
  const resultado = horariosDaSemanaSchema.safeParse(dados);
  if (!resultado.success) {
    const { fieldErrors, formErrors } = resultado.error.flatten();
    throw new ErroDeValidacao({
      ...(fieldErrors as Record<string, string[]>),
      ...(formErrors.length ? { horarios: formErrors } : {}),
    });
  }

  const { horarios } = resultado.data;

  await prisma.$transaction([
    prisma.horarioFuncionamento.deleteMany({ where: { salaoId } }),
    prisma.horarioFuncionamento.createMany({
      data: horarios.map((dia) => ({ salaoId, ...dia })),
    }),
  ]);

  return [...horarios].sort(porDiaDaSemana);
}

/**
 * Janela de funcionamento de um dia da semana. Devolve null quando o salão não
 * abre — seja porque o dia não foi configurado, seja porque está desativado.
 */
export async function janelaDoDia(
  salaoId: string,
  diaSemana: DiaSemana,
): Promise<{ horaAbertura: string; horaFechamento: string } | null> {
  const horario = await prisma.horarioFuncionamento.findUnique({
    where: { salaoId_diaSemana: { salaoId, diaSemana } },
    select: { horaAbertura: true, horaFechamento: true, ativo: true },
  });

  if (!horario || !horario.ativo) return null;

  return { horaAbertura: horario.horaAbertura, horaFechamento: horario.horaFechamento };
}
