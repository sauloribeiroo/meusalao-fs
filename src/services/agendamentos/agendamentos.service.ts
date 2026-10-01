import { Prisma, type StatusAgendamento } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ErroDeConflito, ErroDeValidacao, ErroNaoEncontrado } from "@/services/erros";
import { janelaDoDia } from "@/services/horarios/horarios.service";
import { diaSemanaDe, horaDeMinutos, localDe, minutosDaHora } from "@/services/horarios/tempo";
import { exigirSalao } from "@/services/saloes/saloes.service";
import { exigirServicoDoSalao } from "@/services/servicos/servicos.service";
import { acaoDoSalaoSchema, novoAgendamentoSchema, type AcaoDoSalao } from "@/services/agendamentos/schemas";
import {
  DURACAO_MAXIMA_MIN,
  STATUS_QUE_OCUPAM,
  seSobrepoe,
  type Intervalo,
} from "@/services/agendamentos/disponibilidade.service";

export type AgendamentoPublico = {
  id: string;
  dataHora: string;
  /** Data e hora já no fuso do salão, para a tela não refazer a conversão. */
  data: string;
  hora: string;
  /**
   * Duração contratada no momento do agendamento. Pode diferir da duração
   * atual do serviço, se o salão a tiver mudado depois — para exibir o
   * atendimento na agenda, é esta que vale.
   */
  duracaoMin: number;
  status: StatusAgendamento;
  criadoEm: string;
  salao: { id: string; nome: string; endereco: string; telefone: string | null };
  servico: { id: string; nome: string; preco: number | null; duracaoMin: number };
  cliente: { id: string; nome: string; telefone: string | null };
};

const INCLUSAO = {
  salao: { select: { id: true, nome: true, endereco: true, telefone: true } },
  servico: { select: { id: true, nome: true, preco: true, duracaoMin: true } },
  cliente: { select: { id: true, nome: true, telefone: true } },
} as const;

type AgendamentoDoBanco = Prisma.AgendamentoGetPayload<{ include: typeof INCLUSAO }>;

function paraPublico(agendamento: AgendamentoDoBanco): AgendamentoPublico {
  const { data, hora } = localDe(agendamento.dataHora);

  return {
    id: agendamento.id,
    dataHora: agendamento.dataHora.toISOString(),
    data,
    hora,
    duracaoMin: agendamento.duracaoMin,
    status: agendamento.status,
    criadoEm: agendamento.criadoEm.toISOString(),
    // Campo a campo de propósito: há consulta que traz `donoId` junto no salão
    // para checar permissão, e ele não pode escapar na resposta.
    salao: {
      id: agendamento.salao.id,
      nome: agendamento.salao.nome,
      endereco: agendamento.salao.endereco,
      telefone: agendamento.salao.telefone,
    },
    servico: {
      id: agendamento.servico.id,
      nome: agendamento.servico.nome,
      preco: agendamento.servico.preco === null ? null : Number(agendamento.servico.preco),
      duracaoMin: agendamento.servico.duracaoMin,
    },
    cliente: agendamento.cliente,
  };
}

/**
 * RF16 — cria o agendamento.
 *
 * Regras aplicadas, nesta ordem:
 *  - o serviço precisa ser do salão informado;
 *  - o horário tem de cair na grade do dia e dentro do funcionamento (RGN01);
 *  - não pode estar no passado;
 *  - o horário não pode estar ocupado (RGN02).
 *
 * A última checagem é feita duas vezes de propósito: uma consulta antes, para
 * dar erro legível, e o índice único parcial do banco como palavra final. Entre
 * a consulta e o insert cabe outra requisição — só a restrição no banco fecha
 * essa janela de corrida.
 */
export async function criarAgendamento(clienteId: string, dados: unknown): Promise<AgendamentoPublico> {
  const resultado = novoAgendamentoSchema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { salaoId, servicoId, dataHora } = resultado.data;
  const instante = new Date(dataHora);

  await exigirSalao(salaoId);
  const servico = await exigirServicoDoSalao(salaoId, servicoId);

  if (instante.getTime() <= Date.now()) {
    throw new ErroDeConflito("Não é possível agendar em um horário que já passou");
  }

  await exigirHorarioDentroDoFuncionamento(salaoId, instante, servico.duracaoMin);

  const fim = new Date(instante.getTime() + servico.duracaoMin * 60_000);
  const ocupados = await intervalosDoSalaoEntre(salaoId, instante, fim);
  if (seSobrepoe({ inicio: instante, fim }, ocupados)) {
    throw new ErroDeConflito("Este horário acabou de ser ocupado. Escolha outro.");
  }

  try {
    const agendamento = await prisma.agendamento.create({
      data: { clienteId, salaoId, servicoId, dataHora: instante, duracaoMin: servico.duracaoMin },
      include: INCLUSAO,
    });

    return paraPublico(agendamento);
  } catch (erro) {
    if (ehConflitoDeAgenda(erro)) {
      throw new ErroDeConflito("Este horário acabou de ser ocupado. Escolha outro.");
    }
    throw erro;
  }
}

/**
 * Agendamentos do salão que podem cruzar a janela pedida. A busca recua a
 * duração máxima de um serviço porque um atendimento que começou antes da
 * janela ainda pode estar em curso dentro dela.
 */
async function intervalosDoSalaoEntre(salaoId: string, inicio: Date, fim: Date): Promise<Intervalo[]> {
  const agendamentos = await prisma.agendamento.findMany({
    where: {
      salaoId,
      status: { in: [...STATUS_QUE_OCUPAM] },
      dataHora: { gte: new Date(inicio.getTime() - DURACAO_MAXIMA_MIN * 60_000), lt: fim },
    },
    select: { dataHora: true, duracaoMin: true },
  });

  return agendamentos.map((agendamento) => ({
    inicio: agendamento.dataHora,
    fim: new Date(agendamento.dataHora.getTime() + agendamento.duracaoMin * 60_000),
  }));
}

/**
 * Conflito de agenda detectado pelo banco, e não pela checagem anterior —
 * acontece quando outra requisição grava entre a consulta e o insert.
 *
 * `23P01` é a violação da restrição EXCLUDE de sobreposição. O Prisma não tem
 * código próprio para ela, então chega como erro cru do Postgres; `P2002`
 * cobre o índice único, caso algum volte a existir no futuro.
 */
function ehConflitoDeAgenda(erro: unknown): boolean {
  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    if (erro.code === "P2002") return true;
    if (erro.code === "P2010" && JSON.stringify(erro.meta ?? {}).includes("23P01")) return true;
  }

  return erro instanceof Error && erro.message.includes("agendamentos_sem_sobreposicao");
}

/** RGN01 — o horário precisa existir na grade do dia e caber antes do fechamento. */
async function exigirHorarioDentroDoFuncionamento(
  salaoId: string,
  instante: Date,
  duracaoMin: number,
): Promise<void> {
  const { data, hora } = localDe(instante);

  const janela = await janelaDoDia(salaoId, diaSemanaDe(data));
  if (!janela) throw new ErroDeConflito("O salão não abre neste dia");

  const abertura = minutosDaHora(janela.horaAbertura);
  const fechamento = minutosDaHora(janela.horaFechamento);
  const escolhido = minutosDaHora(hora);

  if (escolhido < abertura || escolhido + duracaoMin > fechamento) {
    throw new ErroDeConflito(
      `Horário fora do funcionamento do salão (${janela.horaAbertura} às ${janela.horaFechamento})`,
    );
  }

  // O slot tem de coincidir com a grade gerada em /api/disponibilidade: sem
  // isso daria para agendar às 09:07 e furar o encaixe dos demais horários.
  if ((escolhido - abertura) % duracaoMin !== 0) {
    const anterior = abertura + Math.floor((escolhido - abertura) / duracaoMin) * duracaoMin;
    throw new ErroDeConflito(
      `Horário fora da grade do serviço. O horário válido mais próximo é ${horaDeMinutos(anterior)}.`,
    );
  }
}

/** RF17 — agendamentos do cliente autenticado, do mais recente para o mais antigo. */
export async function listarAgendamentosDoCliente(
  clienteId: string,
  filtros: { status?: StatusAgendamento } = {},
): Promise<AgendamentoPublico[]> {
  const agendamentos = await prisma.agendamento.findMany({
    where: { clienteId, ...(filtros.status ? { status: filtros.status } : {}) },
    orderBy: { dataHora: "desc" },
    include: INCLUSAO,
  });

  return agendamentos.map(paraPublico);
}

/** RF25 — agenda do salão, opcionalmente de um único dia. */
export async function listarAgendamentosDoSalao(
  salaoId: string,
  filtros: { status?: StatusAgendamento; data?: string } = {},
): Promise<AgendamentoPublico[]> {
  const agendamentos = await prisma.agendamento.findMany({
    where: {
      salaoId,
      ...(filtros.status ? { status: filtros.status } : {}),
      ...(filtros.data ? { dataHora: intervaloDoDia(filtros.data) } : {}),
    },
    orderBy: { dataHora: "asc" },
    include: INCLUSAO,
  });

  return agendamentos.map(paraPublico);
}

export async function buscarAgendamentoDoSalao(salaoId: string, agendamentoId: string): Promise<AgendamentoPublico> {
  const agendamento = await prisma.agendamento.findUnique({
    where: { id: agendamentoId },
    include: INCLUSAO,
  });

  if (!agendamento || agendamento.salaoId !== salaoId) {
    throw new ErroNaoEncontrado("Agendamento não encontrado neste salão");
  }

  return paraPublico(agendamento);
}

/**
 * Detalhe do agendamento para quem tem relação com ele: o cliente que agendou,
 * o dono do salão ou o administrador. Para qualquer outro usuário o recurso
 * responde como inexistente — não confirma que o id existe.
 */
export async function buscarAgendamentoVisivelPara(
  usuario: { id: string; papel: string },
  agendamentoId: string,
): Promise<AgendamentoPublico> {
  const agendamento = await prisma.agendamento.findUnique({
    where: { id: agendamentoId },
    include: { ...INCLUSAO, salao: { select: { id: true, nome: true, endereco: true, telefone: true, donoId: true } } },
  });

  if (!agendamento) throw new ErroNaoEncontrado("Agendamento não encontrado");

  const ehCliente = agendamento.clienteId === usuario.id;
  const ehDono = agendamento.salao.donoId === usuario.id;

  if (!ehCliente && !ehDono && usuario.papel !== "ADMIN") {
    throw new ErroNaoEncontrado("Agendamento não encontrado");
  }

  return paraPublico(agendamento);
}

/** Transições permitidas ao salão: de onde pode sair, para onde vai. */
const TRANSICOES: Record<AcaoDoSalao, { de: StatusAgendamento[]; para: StatusAgendamento }> = {
  confirmar: { de: ["PENDENTE"], para: "CONFIRMADO" },
  recusar: { de: ["PENDENTE", "CONFIRMADO"], para: "CANCELADO" },
  concluir: { de: ["CONFIRMADO"], para: "CONCLUIDO" },
};

const DESCRICAO: Record<StatusAgendamento, string> = {
  PENDENTE: "pendente",
  CONFIRMADO: "confirmado",
  CANCELADO: "cancelado",
  CONCLUIDO: "concluído",
};

/**
 * RF25 — o salão confirma, recusa ou conclui um agendamento.
 *
 * A checagem de quem pode agir (RGN07) fica na rota, que resolve o salão a
 * partir da sessão: aqui já chega o salaoId confirmado como sendo do usuário.
 */
export async function aplicarAcaoDoSalao(
  salaoId: string,
  agendamentoId: string,
  dados: unknown,
): Promise<AgendamentoPublico> {
  const resultado = acaoDoSalaoSchema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { acao } = resultado.data;
  const atual = await prisma.agendamento.findUnique({
    where: { id: agendamentoId },
    select: { id: true, salaoId: true, status: true },
  });

  if (!atual || atual.salaoId !== salaoId) throw new ErroNaoEncontrado("Agendamento não encontrado neste salão");

  const transicao = TRANSICOES[acao];
  if (!transicao.de.includes(atual.status)) {
    throw new ErroDeConflito(
      `Não é possível ${acao} um agendamento ${DESCRICAO[atual.status]}. ` +
        `A ação vale apenas para: ${transicao.de.map((status) => DESCRICAO[status]).join(", ")}.`,
    );
  }

  const agendamento = await prisma.agendamento.update({
    where: { id: agendamentoId },
    data: { status: transicao.para },
    include: INCLUSAO,
  });

  return paraPublico(agendamento);
}

/** Intervalo de instantes que cobre um dia local do salão. */
function intervaloDoDia(data: string): { gte: Date; lt: Date } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(data))) {
    throw new ErroDeValidacao({ data: ["Data inválida (use AAAA-MM-DD)"] });
  }

  const [ano, mes, dia] = data.split("-").map(Number);
  const inicio = new Date(`${data}T00:00:00.000-03:00`);
  const fim = new Date(Date.UTC(ano, mes - 1, dia + 1));

  return { gte: inicio, lt: new Date(`${fim.toISOString().slice(0, 10)}T00:00:00.000-03:00`) };
}
