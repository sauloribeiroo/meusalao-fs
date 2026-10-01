import { prisma } from "@/lib/prisma";
import { ErroDeAutorizacao, ErroDeValidacao } from "@/services/erros";
import { novoServicoSchema } from "@/services/servicos/schemas";

async function confirmarDono(salaoId: string, donoId: string) {
  const salao = await prisma.salao.findUnique({ where: { id: salaoId }, select: { donoId: true } });
  if (!salao || salao.donoId !== donoId) throw new ErroDeAutorizacao();
}

export async function listarServicosPorSalao(salaoId: string) {
  return prisma.servico.findMany({ where: { salaoId }, orderBy: { nome: "asc" } });
}

export async function criarServico(donoId: string, salaoId: string, dados: unknown) {
  await confirmarDono(salaoId, donoId);

  const resultado = novoServicoSchema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { nome, preco, duracaoMin } = resultado.data;
  return prisma.servico.create({ data: { salaoId, nome, preco, duracaoMin } });
}

export async function atualizarServico(donoId: string, servicoId: string, dados: unknown) {
  const servico = await prisma.servico.findUnique({ where: { id: servicoId }, select: { salaoId: true } });
  if (!servico) throw new ErroDeAutorizacao();
  await confirmarDono(servico.salaoId, donoId);

  const resultado = novoServicoSchema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { nome, preco, duracaoMin } = resultado.data;
  return prisma.servico.update({ where: { id: servicoId }, data: { nome, preco, duracaoMin } });
}

export async function removerServico(donoId: string, servicoId: string) {
  const servico = await prisma.servico.findUnique({ where: { id: servicoId }, select: { salaoId: true } });
  if (!servico) throw new ErroDeAutorizacao();
  await confirmarDono(servico.salaoId, donoId);

  await prisma.servico.delete({ where: { id: servicoId } });
}
