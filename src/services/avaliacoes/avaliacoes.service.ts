import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ErroDeConflito, ErroDeValidacao, ErroNaoEncontrado } from "@/services/erros";
import { novaAvaliacaoSchema } from "@/services/avaliacoes/schemas";

/**
 * RF19 — avaliação do salão depois do atendimento.
 *
 * RGN03 governa o fluxo inteiro: só agendamento CONCLUÍDO pode ser avaliado, e
 * no máximo uma vez. A unicidade é garantida pelo `@unique` em `agendamentoId`,
 * não só pela consulta — entre ler e gravar cabe outra requisição.
 *
 * O salão avaliado nunca vem do cliente: é lido do agendamento. Aceitar um
 * salaoId de fora deixaria alguém avaliar um salão onde nunca esteve.
 */

export type AvaliacaoPublica = {
  id: string;
  nota: number;
  comentario: string | null;
  criadoEm: string;
  cliente: { nome: string };
  servico: { nome: string };
};

const INCLUSAO = {
  cliente: { select: { nome: true } },
  agendamento: { select: { servico: { select: { nome: true } } } },
} as const;

type AvaliacaoDoBanco = Prisma.AvaliacaoGetPayload<{ include: typeof INCLUSAO }>;

const paraPublico = (avaliacao: AvaliacaoDoBanco): AvaliacaoPublica => ({
  id: avaliacao.id,
  nota: avaliacao.nota,
  comentario: avaliacao.comentario,
  criadoEm: avaliacao.criadoEm.toISOString(),
  cliente: { nome: avaliacao.cliente.nome },
  servico: { nome: avaliacao.agendamento.servico.nome },
});

export async function criarAvaliacao(clienteId: string, dados: unknown): Promise<AvaliacaoPublica> {
  const resultado = novaAvaliacaoSchema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { agendamentoId, nota, comentario } = resultado.data;

  const agendamento = await prisma.agendamento.findUnique({
    where: { id: agendamentoId },
    select: { id: true, clienteId: true, salaoId: true, status: true },
  });

  // Agendamento de outro cliente responde como inexistente, e não como
  // proibido: confirmar que o id existe já é informação demais.
  if (!agendamento || agendamento.clienteId !== clienteId) {
    throw new ErroNaoEncontrado("Agendamento não encontrado");
  }

  if (agendamento.status !== "CONCLUIDO") {
    throw new ErroDeConflito("Só é possível avaliar um atendimento já concluído");
  }

  try {
    const avaliacao = await prisma.avaliacao.create({
      data: {
        clienteId,
        salaoId: agendamento.salaoId,
        agendamentoId: agendamento.id,
        nota,
        comentario: comentario ?? null,
      },
      include: INCLUSAO,
    });

    return paraPublico(avaliacao);
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      throw new ErroDeConflito("Este atendimento já foi avaliado");
    }
    throw erro;
  }
}

/** Avaliações de um salão, da mais recente para a mais antiga. */
export async function listarAvaliacoesDoSalao(salaoId: string): Promise<AvaliacaoPublica[]> {
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { salaoId },
    orderBy: { criadoEm: "desc" },
    include: INCLUSAO,
  });

  return avaliacoes.map(paraPublico);
}

export type ResumoDeAvaliacoes = {
  /** Null enquanto ninguém avaliou — a tela mostra "sem avaliações". */
  notaMedia: number | null;
  total: number;
};

export async function resumoDeAvaliacoes(salaoId: string): Promise<ResumoDeAvaliacoes> {
  const resumo = await prisma.avaliacao.aggregate({
    where: { salaoId },
    _avg: { nota: true },
    _count: true,
  });

  return { notaMedia: resumo._avg.nota, total: resumo._count };
}

/**
 * Ids dos agendamentos do cliente que já foram avaliados. A tela de "meus
 * agendamentos" usa isso para decidir entre oferecer o botão de avaliar e
 * mostrar a nota dada — uma consulta só, em vez de uma por agendamento.
 */
export async function agendamentosAvaliadosDoCliente(clienteId: string): Promise<Set<string>> {
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { clienteId },
    select: { agendamentoId: true },
  });

  return new Set(avaliacoes.map((avaliacao) => avaliacao.agendamentoId));
}
