import { prisma } from "@/lib/prisma";
import { ErroDeAutorizacao, ErroDeValidacao, ErroNaoEncontrado } from "@/services/erros";
import { coordenadaValida, distanciaEmKm, type Coordenada } from "@/services/saloes/distancia";
import { edicaoSalaoSchema } from "@/services/saloes/schemas";

/**
 * Resolução do salão em que o dono autenticado está trabalhando.
 *
 * O MVP assume um salão por dono: as telas do salão (serviços, horários, agenda)
 * não pedem qual salão editar. O schema já permite vários — a relação é 1:N —,
 * então quando existir troca de salão, basta estas funções passarem a receber
 * o id escolhido.
 */

/** Salão do dono, ou null se ele ainda não cadastrou nenhum. */
export async function salaoDoDono(donoId: string): Promise<{ id: string; nome: string; publicado: boolean } | null> {
  return prisma.salao.findFirst({
    where: { donoId },
    orderBy: { criadoEm: "asc" },
    select: { id: true, nome: true, publicado: true },
  });
}

/** Igual à anterior, mas exige que o salão exista. */
export async function exigirSalaoDoDono(donoId: string): Promise<{ id: string; nome: string; publicado: boolean }> {
  const salao = await salaoDoDono(donoId);
  if (!salao) {
    throw new ErroNaoEncontrado("Nenhum salão cadastrado para este usuário. Conclua o cadastro do salão primeiro.");
  }

  return salao;
}

/**
 * Garante que o salão pertence a quem está pedindo (RGN07). O administrador
 * passa direto, como prevê a própria regra.
 */
export async function exigirSalaoDoUsuario(
  salaoId: string,
  usuario: { id: string; papel: string },
): Promise<{ id: string; nome: string }> {
  const salao = await prisma.salao.findUnique({
    where: { id: salaoId },
    select: { id: true, nome: true, donoId: true },
  });

  if (!salao) throw new ErroNaoEncontrado("Salão não encontrado");
  if (usuario.papel !== "ADMIN" && salao.donoId !== usuario.id) {
    throw new ErroDeAutorizacao("Este salão pertence a outro usuário");
  }

  return { id: salao.id, nome: salao.nome };
}

/** Dados do salão como a tela de edição precisa deles. */
export type SalaoEditavel = {
  id: string;
  nome: string;
  descricao: string | null;
  endereco: string;
  telefone: string | null;
  tipo: string | null;
  latitude: number | null;
  longitude: number | null;
  publicado: boolean;
};

export async function buscarSalaoEditavel(salaoId: string): Promise<SalaoEditavel> {
  const salao = await prisma.salao.findUnique({
    where: { id: salaoId },
    select: {
      id: true,
      nome: true,
      descricao: true,
      endereco: true,
      telefone: true,
      tipo: true,
      latitude: true,
      longitude: true,
      publicado: true,
    },
  });

  if (!salao) throw new ErroNaoEncontrado("Salão não encontrado");

  return salao;
}

/**
 * RF07 — atualiza os dados cadastrais do salão.
 *
 * Quem pode editar já foi resolvido antes de chegar aqui: o chamador passa um
 * salaoId que confirmou pertencer ao usuário (RGN07).
 */
export async function atualizarSalao(salaoId: string, dados: unknown): Promise<SalaoEditavel> {
  const resultado = edicaoSalaoSchema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { nome, endereco, descricao, tipo, telefone, latitude, longitude } = resultado.data;

  await prisma.salao.update({
    where: { id: salaoId },
    data: {
      nome,
      endereco,
      descricao: descricao ?? null,
      tipo: tipo ?? null,
      telefone: telefone ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    },
  });

  return buscarSalaoEditavel(salaoId);
}

/** Salão como aparece na listagem pública e no mapa. */
export type SalaoNaLista = {
  id: string;
  nome: string;
  endereco: string;
  tipo: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Null quando não há localização do usuário ou o salão não tem coordenadas. */
  distanciaKm: number | null;
  /** Menor preço entre os serviços; null exibe "Consultar preço" (RGN06). */
  precoMinimo: number | null;
  totalServicos: number;
};

/**
 * RF11 — salões publicados, ordenados por proximidade quando há localização.
 *
 * Sem a permissão de geolocalização, a lista continua funcionando, ordenada por
 * nome — é a degradação graciosa que o RNF08 pede. Salão sem coordenadas nunca
 * é descartado: entra depois dos que têm distância conhecida.
 */
export async function listarSaloesPublicados(origem?: Coordenada | null): Promise<SalaoNaLista[]> {
  // RGN05: só salão publicado aparece na busca e no mapa.
  const saloes = await prisma.salao.findMany({
    where: { publicado: true },
    select: {
      id: true,
      nome: true,
      endereco: true,
      tipo: true,
      latitude: true,
      longitude: true,
      servicos: { select: { preco: true } },
    },
  });

  const lista = saloes.map((salao) => {
    const precos = salao.servicos
      .map((servico) => (servico.preco === null ? null : Number(servico.preco)))
      .filter((preco): preco is number => preco !== null);

    return {
      id: salao.id,
      nome: salao.nome,
      endereco: salao.endereco,
      tipo: salao.tipo,
      latitude: salao.latitude,
      longitude: salao.longitude,
      distanciaKm:
        origem && coordenadaValida(salao.latitude, salao.longitude)
          ? distanciaEmKm(origem, { latitude: salao.latitude!, longitude: salao.longitude! })
          : null,
      precoMinimo: precos.length ? Math.min(...precos) : null,
      totalServicos: salao.servicos.length,
    };
  });

  return lista.sort((a, b) => {
    if (a.distanciaKm !== null && b.distanciaKm !== null) return a.distanciaKm - b.distanciaKm;
    // Quem tem distância conhecida vem antes de quem não tem.
    if (a.distanciaKm !== null) return -1;
    if (b.distanciaKm !== null) return 1;

    return a.nome.localeCompare(b.nome, "pt-BR");
  });
}

export type SalaoComparado = {
  id: string;
  nome: string;
  tipo: string | null;
  endereco: string;
  distanciaKm: number | null;
  /** Null enquanto o salão não tiver avaliações (RF19 / issue #26). */
  notaMedia: number | null;
  totalAvaliacoes: number;
  servicos: { nome: string; preco: number | null; duracaoMin: number }[];
};

/** Quantos salões cabem numa comparação legível lado a lado. */
export const MAXIMO_COMPARACAO = 3;

/**
 * RF13 — dados dos salões escolhidos para comparação.
 *
 * Devolve na ordem em que os ids foram pedidos, para as colunas da tabela não
 * trocarem de lugar a cada carregamento. Id inexistente ou de salão não
 * publicado é simplesmente ignorado (RGN05).
 */
export async function compararSaloes(ids: string[], origem?: Coordenada | null): Promise<SalaoComparado[]> {
  const escolhidos = [...new Set(ids)].slice(0, MAXIMO_COMPARACAO);
  if (escolhidos.length === 0) return [];

  const saloes = await prisma.salao.findMany({
    where: { id: { in: escolhidos }, publicado: true },
    select: {
      id: true,
      nome: true,
      tipo: true,
      endereco: true,
      latitude: true,
      longitude: true,
      servicos: { select: { nome: true, preco: true, duracaoMin: true }, orderBy: { nome: "asc" } },
      avaliacoes: { select: { nota: true } },
    },
  });

  const porId = new Map(saloes.map((salao) => [salao.id, salao]));

  return escolhidos
    .map((id) => porId.get(id))
    .filter((salao): salao is NonNullable<typeof salao> => Boolean(salao))
    .map((salao) => {
      const notas = salao.avaliacoes.map((avaliacao) => avaliacao.nota);

      return {
        id: salao.id,
        nome: salao.nome,
        tipo: salao.tipo,
        endereco: salao.endereco,
        distanciaKm:
          origem && coordenadaValida(salao.latitude, salao.longitude)
            ? distanciaEmKm(origem, { latitude: salao.latitude!, longitude: salao.longitude! })
            : null,
        notaMedia: notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null,
        totalAvaliacoes: notas.length,
        servicos: salao.servicos.map((servico) => ({
          nome: servico.nome,
          preco: servico.preco === null ? null : Number(servico.preco),
          duracaoMin: servico.duracaoMin,
        })),
      };
    });
}

/** Existência do salão, para as rotas públicas (busca, disponibilidade). */
export async function exigirSalao(salaoId: string): Promise<{ id: string; nome: string; publicado: boolean }> {
  const salao = await prisma.salao.findUnique({
    where: { id: salaoId },
    select: { id: true, nome: true, publicado: true },
  });

  if (!salao) throw new ErroNaoEncontrado("Salão não encontrado");

  return salao;
}
