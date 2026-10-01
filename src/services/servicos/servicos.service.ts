import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ErroDeConflito, ErroDeValidacao, ErroNaoEncontrado } from "@/services/erros";
import { edicaoServicoSchema, novoServicoSchema } from "@/services/servicos/schemas";

/** Serviço como a API o devolve. `preco` null significa "Consultar preço" (RGN06). */
export type ServicoPublico = {
  id: string;
  nome: string;
  preco: number | null;
  duracaoMin: number;
};

type ServicoDoBanco = { id: string; nome: string; preco: Prisma.Decimal | null; duracaoMin: number };

/**
 * Decimal do Prisma não é serializável em JSON (viraria string ou objeto, a
 * depender da versão). Convertemos uma vez, aqui, para o front receber número.
 */
const paraPublico = (servico: ServicoDoBanco): ServicoPublico => ({
  id: servico.id,
  nome: servico.nome,
  preco: servico.preco === null ? null : Number(servico.preco),
  duracaoMin: servico.duracaoMin,
});

const SELECAO = { id: true, nome: true, preco: true, duracaoMin: true } as const;

export async function listarServicosDoSalao(salaoId: string): Promise<ServicoPublico[]> {
  const servicos = await prisma.servico.findMany({
    where: { salaoId },
    orderBy: { criadoEm: "asc" },
    select: SELECAO,
  });

  return servicos.map(paraPublico);
}

/** RF20 — cadastra um serviço no salão. */
export async function cadastrarServico(salaoId: string, dados: unknown): Promise<ServicoPublico> {
  const resultado = novoServicoSchema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { nome, preco, duracaoMin } = resultado.data;

  const repetido = await prisma.servico.findFirst({
    where: { salaoId, nome: { equals: nome, mode: "insensitive" } },
    select: { id: true },
  });
  if (repetido) throw new ErroDeConflito("Este salão já tem um serviço com esse nome");

  const servico = await prisma.servico.create({
    data: { salaoId, nome, duracaoMin, preco: preco ?? null },
    select: SELECAO,
  });

  return paraPublico(servico);
}

export async function editarServico(salaoId: string, servicoId: string, dados: unknown): Promise<ServicoPublico> {
  const resultado = edicaoServicoSchema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  await exigirServicoDoSalao(salaoId, servicoId);
  const { nome, preco, duracaoMin } = resultado.data;

  if (nome) {
    const repetido = await prisma.servico.findFirst({
      where: { salaoId, nome: { equals: nome, mode: "insensitive" }, id: { not: servicoId } },
      select: { id: true },
    });
    if (repetido) throw new ErroDeConflito("Este salão já tem um serviço com esse nome");
  }

  const servico = await prisma.servico.update({
    where: { id: servicoId },
    data: {
      nome,
      duracaoMin,
      // `preco` ausente mantém o valor; null explícito zera para "Consultar preço".
      ...(preco === undefined ? {} : { preco }),
    },
    select: SELECAO,
  });

  return paraPublico(servico);
}

/**
 * Remove o serviço. Agendamentos guardam servicoId com FK restritiva, então um
 * serviço já agendado não some do histórico — nesse caso o salão deve editá-lo.
 */
export async function removerServico(salaoId: string, servicoId: string): Promise<void> {
  await exigirServicoDoSalao(salaoId, servicoId);

  const agendado = await prisma.agendamento.findFirst({
    where: { servicoId },
    select: { id: true },
  });
  if (agendado) {
    throw new ErroDeConflito("Este serviço já tem agendamentos e não pode ser excluído. Edite-o no lugar.");
  }

  await prisma.servico.delete({ where: { id: servicoId } });
}

/** Garante que o serviço existe e pertence ao salão informado. */
export async function exigirServicoDoSalao(
  salaoId: string,
  servicoId: string,
): Promise<{ id: string; nome: string; duracaoMin: number }> {
  const servico = await prisma.servico.findUnique({
    where: { id: servicoId },
    select: { id: true, nome: true, duracaoMin: true, salaoId: true },
  });

  if (!servico || servico.salaoId !== salaoId) throw new ErroNaoEncontrado("Serviço não encontrado neste salão");

  return { id: servico.id, nome: servico.nome, duracaoMin: servico.duracaoMin };
}
