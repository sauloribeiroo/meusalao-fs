import { prisma } from "@/lib/prisma";
import { ErroDeAutorizacao, ErroDeConflito, ErroDeValidacao } from "@/services/erros";
import { atualizarHorariosSchema, novoSalaoSchema } from "@/services/saloes/schemas";

export type Salao = Awaited<ReturnType<typeof buscarSalaoPorId>>;

/**
 * Cadastro do salão e seus horários de funcionamento, feito pelo dono no
 * onboarding. Um dono só pode ter um salão (constraint única em `donoId`).
 */
export async function criarSalao(donoId: string, dados: unknown) {
  const resultado = novoSalaoSchema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  if (await prisma.salao.findUnique({ where: { donoId }, select: { id: true } })) {
    throw new ErroDeConflito("Você já tem um salão cadastrado");
  }

  const { nome, endereco, telefone, horarios } = resultado.data;

  return prisma.salao.create({
    data: {
      donoId,
      nome,
      endereco,
      telefone,
      horarios: { create: horarios },
    },
  });
}

export async function buscarSalaoPorDono(donoId: string) {
  return prisma.salao.findUnique({ where: { donoId } });
}

export async function buscarSalaoPorId(id: string) {
  return prisma.salao.findUnique({ where: { id } });
}

export async function buscarHorariosPorSalao(salaoId: string) {
  return prisma.horarioFuncionamento.findMany({ where: { salaoId } });
}

/**
 * Substitui os 7 horários de funcionamento do salão. Apaga e recria em
 * transação em vez de upsert por dia: mais simples e o volume é sempre
 * pequeno (7 linhas), sem custo real de performance.
 */
export async function atualizarHorarios(donoId: string, salaoId: string, dados: unknown) {
  const salao = await prisma.salao.findUnique({ where: { id: salaoId }, select: { donoId: true } });
  if (!salao || salao.donoId !== donoId) throw new ErroDeAutorizacao();

  const resultado = atualizarHorariosSchema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { horarios } = resultado.data;

  await prisma.$transaction([
    prisma.horarioFuncionamento.deleteMany({ where: { salaoId } }),
    prisma.horarioFuncionamento.createMany({ data: horarios.map((h) => ({ ...h, salaoId })) }),
  ]);
}
