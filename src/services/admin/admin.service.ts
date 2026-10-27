import type { Papel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ErroDeConflito, ErroDeValidacao, ErroNaoEncontrado } from "@/services/erros";
import {
  alteracaoDePapelSchema,
  buscaAdminSchema,
  moderacaoDeSalaoSchema,
} from "@/services/admin/schemas";

/**
 * RF26 — administração da plataforma.
 *
 * Quem pode chegar aqui já foi resolvido antes (papel ADMIN, via `exigirPapel`
 * na rota ou checagem no layout). Este serviço cuida das regras que sobram:
 * sobretudo as que impedem o administrador de se trancar para fora.
 */

export type ResumoDaPlataforma = {
  usuarios: number;
  donos: number;
  saloes: number;
  saloesPublicados: number;
  agendamentos: number;
  avaliacoes: number;
};

export async function resumoDaPlataforma(): Promise<ResumoDaPlataforma> {
  const [usuarios, donos, saloes, saloesPublicados, agendamentos, avaliacoes] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.count({ where: { papel: "DONO_SALAO" } }),
    prisma.salao.count(),
    prisma.salao.count({ where: { publicado: true } }),
    prisma.agendamento.count(),
    prisma.avaliacao.count(),
  ]);

  return { usuarios, donos, saloes, saloesPublicados, agendamentos, avaliacoes };
}

export type UsuarioAdmin = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  criadoEm: string;
  totalSaloes: number;
  totalAgendamentos: number;
};

export async function listarUsuarios(filtros: unknown = {}): Promise<UsuarioAdmin[]> {
  const resultado = buscaAdminSchema.safeParse(filtros);
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { termo, papel } = resultado.data;

  const usuarios = await prisma.usuario.findMany({
    where: {
      ...(papel ? { papel } : {}),
      ...(termo
        ? {
            OR: [
              { nome: { contains: termo, mode: "insensitive" as const } },
              { email: { contains: termo, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      nome: true,
      email: true,
      papel: true,
      criadoEm: true,
      _count: { select: { saloes: true, agendamentos: true } },
    },
    take: 100,
  });

  return usuarios.map((usuario) => ({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
    criadoEm: usuario.criadoEm.toISOString(),
    totalSaloes: usuario._count.saloes,
    totalAgendamentos: usuario._count.agendamentos,
  }));
}

/**
 * Troca o papel de um usuário.
 *
 * Duas travas: o administrador não rebaixa a si mesmo, e a plataforma não fica
 * sem nenhum administrador. Sem elas, um clique deixaria o módulo inacessível
 * para sempre — não há tela de recuperação de papel, e o conserto só viria por
 * acesso direto ao banco.
 */
export async function alterarPapel(administradorId: string, dados: unknown): Promise<UsuarioAdmin> {
  const resultado = alteracaoDePapelSchema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { usuarioId, papel } = resultado.data;

  const alvo = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, papel: true },
  });
  if (!alvo) throw new ErroNaoEncontrado("Usuário não encontrado");

  if (alvo.id === administradorId && papel !== "ADMIN") {
    throw new ErroDeConflito("Você não pode remover o próprio acesso de administrador");
  }

  if (alvo.papel === "ADMIN" && papel !== "ADMIN") {
    const administradores = await prisma.usuario.count({ where: { papel: "ADMIN" } });
    if (administradores <= 1) {
      throw new ErroDeConflito("A plataforma precisa de ao menos um administrador");
    }
  }

  // Rebaixar um dono que tem salão deixaria o salão sem gestor: o salão sai do
  // ar junto, para não continuar recebendo agendamentos que ninguém atende.
  if (alvo.papel === "DONO_SALAO" && papel === "CLIENTE") {
    await prisma.salao.updateMany({ where: { donoId: alvo.id }, data: { publicado: false } });
  }

  await prisma.usuario.update({ where: { id: usuarioId }, data: { papel } });

  return buscarUsuarioAdmin(usuarioId);
}

async function buscarUsuarioAdmin(usuarioId: string): Promise<UsuarioAdmin> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      nome: true,
      email: true,
      papel: true,
      criadoEm: true,
      _count: { select: { saloes: true, agendamentos: true } },
    },
  });

  if (!usuario) throw new ErroNaoEncontrado("Usuário não encontrado");

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
    criadoEm: usuario.criadoEm.toISOString(),
    totalSaloes: usuario._count.saloes,
    totalAgendamentos: usuario._count.agendamentos,
  };
}

export type SalaoAdmin = {
  id: string;
  nome: string;
  endereco: string;
  publicado: boolean;
  criadoEm: string;
  dono: { id: string; nome: string; email: string };
  totalServicos: number;
  totalAgendamentos: number;
  notaMedia: number | null;
  totalAvaliacoes: number;
};

const SELECAO_SALAO = {
  id: true,
  nome: true,
  endereco: true,
  publicado: true,
  criadoEm: true,
  dono: { select: { id: true, nome: true, email: true } },
  avaliacoes: { select: { nota: true } },
  _count: { select: { servicos: true, agendamentos: true } },
} as const;

type SalaoDoBanco = {
  id: string;
  nome: string;
  endereco: string;
  publicado: boolean;
  criadoEm: Date;
  dono: { id: string; nome: string; email: string };
  avaliacoes: { nota: number }[];
  _count: { servicos: number; agendamentos: number };
};

function salaoParaAdmin(salao: SalaoDoBanco): SalaoAdmin {
  const notas = salao.avaliacoes.map((avaliacao) => avaliacao.nota);

  return {
    id: salao.id,
    nome: salao.nome,
    endereco: salao.endereco,
    publicado: salao.publicado,
    criadoEm: salao.criadoEm.toISOString(),
    dono: salao.dono,
    totalServicos: salao._count.servicos,
    totalAgendamentos: salao._count.agendamentos,
    notaMedia: notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null,
    totalAvaliacoes: notas.length,
  };
}

/** Todos os salões, publicados ou não — o contrário da listagem pública. */
export async function listarSaloesParaAdmin(termo?: string): Promise<SalaoAdmin[]> {
  const saloes = await prisma.salao.findMany({
    where: termo ? { nome: { contains: termo, mode: "insensitive" } } : undefined,
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      nome: true,
      endereco: true,
      publicado: true,
      criadoEm: true,
      dono: { select: { id: true, nome: true, email: true } },
      avaliacoes: { select: { nota: true } },
      _count: { select: { servicos: true, agendamentos: true } },
    },
    take: 100,
  });

  return saloes.map(salaoParaAdmin);
}

/**
 * Moderação: tira um salão do ar, ou devolve.
 *
 * Diferente da publicação pelo próprio dono (RF23), aqui o checklist da RGN05
 * não é consultado — o administrador está corrigindo um problema, e exigir o
 * cadastro completo atrapalharia justamente o caso em que ele precisa agir.
 */
export async function moderarSalao(dados: unknown): Promise<SalaoAdmin> {
  const resultado = moderacaoDeSalaoSchema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { salaoId, publicado } = resultado.data;

  const existe = await prisma.salao.findUnique({ where: { id: salaoId }, select: { id: true } });
  if (!existe) throw new ErroNaoEncontrado("Salão não encontrado");

  const salao = await prisma.salao.update({
    where: { id: salaoId },
    data: { publicado },
    select: SELECAO_SALAO,
  });

  return salaoParaAdmin(salao);
}

export type AvaliacaoAdmin = {
  id: string;
  nota: number;
  comentario: string | null;
  criadoEm: string;
  cliente: { nome: string };
  salao: { id: string; nome: string };
};

/** Avaliações com comentário, que são as que podem exigir moderação. */
export async function listarAvaliacoesParaModeracao(): Promise<AvaliacaoAdmin[]> {
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { comentario: { not: null } },
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      nota: true,
      comentario: true,
      criadoEm: true,
      cliente: { select: { nome: true } },
      salao: { select: { id: true, nome: true } },
    },
    take: 100,
  });

  return avaliacoes.map((avaliacao) => ({
    ...avaliacao,
    criadoEm: avaliacao.criadoEm.toISOString(),
  }));
}

/**
 * Remove o comentário, preservando a nota.
 *
 * Apagar a avaliação inteira distorceria a média do salão — um comentário
 * ofensivo não torna a nota inválida. E liberaria o cliente a avaliar de novo,
 * já que a RGN03 se apoia na existência do registro.
 */
export async function removerComentario(avaliacaoId: string): Promise<void> {
  const existe = await prisma.avaliacao.findUnique({
    where: { id: avaliacaoId },
    select: { id: true },
  });
  if (!existe) throw new ErroNaoEncontrado("Avaliação não encontrada");

  await prisma.avaliacao.update({ where: { id: avaliacaoId }, data: { comentario: null } });
}
