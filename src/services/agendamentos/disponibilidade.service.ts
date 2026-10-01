import { prisma } from "@/lib/prisma";
import { ErroDeValidacao } from "@/services/erros";
import { janelaDoDia } from "@/services/horarios/horarios.service";
import { dataValida, diaSemanaDe, horaDeMinutos, instanteDe, minutosDaHora } from "@/services/horarios/tempo";
import { exigirSalao } from "@/services/saloes/saloes.service";
import { exigirServicoDoSalao } from "@/services/servicos/servicos.service";

/**
 * Status que ocupam a agenda — os mesmos da restrição EXCLUDE no banco (RGN02).
 * Só o cancelamento devolve o horário: um atendimento concluído aconteceu de
 * fato naquele horário e não pode ser revendido.
 */
export const STATUS_QUE_OCUPAM = ["PENDENTE", "CONFIRMADO", "CONCLUIDO"] as const;

export type Slot = {
  /** "09:00", no fuso do salão. */
  hora: string;
  /** Instante absoluto — é isto que volta no POST de agendamento. */
  dataHora: string;
  livre: boolean;
};

export type Disponibilidade = {
  salaoId: string;
  servicoId: string;
  data: string;
  /** Null quando o salão não abre nesse dia. */
  funcionamento: { horaAbertura: string; horaFechamento: string } | null;
  duracaoMin: number;
  slots: Slot[];
};

/**
 * RF15 — slots de um dia para um serviço.
 *
 * A grade é gerada da abertura ao fechamento em passos da duração do serviço, e
 * o último slot só entra se o atendimento terminar antes de fechar. Horários já
 * tomados (RGN01/RGN02) voltam com `livre: false` em vez de sumirem: a tela
 * precisa mostrar o que está ocupado, não esconder (RF15).
 */
export async function consultarDisponibilidade(params: {
  salaoId: string;
  servicoId: string;
  data: string;
}): Promise<Disponibilidade> {
  const { salaoId, servicoId, data } = params;

  if (!dataValida(data)) {
    throw new ErroDeValidacao({ data: ["Data inválida (use AAAA-MM-DD, ex.: 2026-10-05)"] });
  }

  await exigirSalao(salaoId);
  const servico = await exigirServicoDoSalao(salaoId, servicoId);

  const janela = await janelaDoDia(salaoId, diaSemanaDe(data));
  if (!janela) {
    return { salaoId, servicoId, data, funcionamento: null, duracaoMin: servico.duracaoMin, slots: [] };
  }

  const ocupados = await intervalosOcupados(salaoId, data);
  const agora = Date.now();

  const abertura = minutosDaHora(janela.horaAbertura);
  const fechamento = minutosDaHora(janela.horaFechamento);
  const slots: Slot[] = [];

  for (let minuto = abertura; minuto + servico.duracaoMin <= fechamento; minuto += servico.duracaoMin) {
    const hora = horaDeMinutos(minuto);
    const inicio = instanteDe(data, hora);
    const fim = new Date(inicio.getTime() + servico.duracaoMin * 60_000);

    slots.push({
      hora,
      dataHora: inicio.toISOString(),
      livre:
        !seSobrepoe({ inicio, fim }, ocupados) &&
        // Horário no passado não é oferecido, mesmo estando livre na agenda.
        inicio.getTime() > agora,
    });
  }

  return {
    salaoId,
    servicoId,
    data,
    funcionamento: janela,
    duracaoMin: servico.duracaoMin,
    slots,
  };
}

export type Intervalo = { inicio: Date; fim: Date };

/**
 * Dois atendimentos se cruzam quando um começa antes de o outro terminar, dos
 * dois lados. Limites encostados não contam: um serviço que termina 10:00 não
 * conflita com outro que começa 10:00.
 */
export const seSobrepoe = (alvo: Intervalo, ocupados: Intervalo[]): boolean =>
  ocupados.some((ocupado) => alvo.inicio < ocupado.fim && ocupado.inicio < alvo.fim);

/**
 * Intervalos ocupados no salão naquele dia.
 *
 * Precisa ser intervalo, não hora de início: um serviço de 60 min às 10:00
 * ocupa a agenda até as 11:00 e tem de bloquear também um de 30 min às 10:30.
 *
 * A busca começa um pouco antes do dia porque um atendimento iniciado na
 * véspera pode atravessar a meia-noite e invadir a manhã seguinte.
 */
async function intervalosOcupados(salaoId: string, data: string): Promise<Intervalo[]> {
  const inicioDoDia = instanteDe(data, "00:00");
  const fimDoDia = instanteDe(proximoDia(data), "00:00");
  const margem = new Date(inicioDoDia.getTime() - DURACAO_MAXIMA_MIN * 60_000);

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      salaoId,
      status: { in: [...STATUS_QUE_OCUPAM] },
      dataHora: { gte: margem, lt: fimDoDia },
    },
    select: { dataHora: true, duracaoMin: true },
  });

  return agendamentos.map((agendamento) => ({
    inicio: agendamento.dataHora,
    fim: new Date(agendamento.dataHora.getTime() + agendamento.duracaoMin * 60_000),
  }));
}

/** Teto de duração de um serviço, igual ao validado no schema Zod. */
export const DURACAO_MAXIMA_MIN = 600;

/** "2026-10-05" → "2026-10-06", respeitando viradas de mês e ano. */
function proximoDia(data: string): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  const seguinte = new Date(Date.UTC(ano, mes - 1, dia + 1));
  return seguinte.toISOString().slice(0, 10);
}
