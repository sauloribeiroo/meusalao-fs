import { prisma } from "@/lib/prisma";
import { ErroDeValidacao } from "@/services/erros";
import { janelaDoDia } from "@/services/horarios/horarios.service";
import {
  dataValida,
  diaSemanaDe,
  horaDeMinutos,
  instanteDe,
  localDe,
  minutosDaHora,
} from "@/services/horarios/tempo";
import { exigirSalao } from "@/services/saloes/saloes.service";
import { exigirServicoDoSalao } from "@/services/servicos/servicos.service";

/**
 * Status que ocupam a agenda — os mesmos do índice único parcial (RGN02).
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

  const ocupados = await horariosOcupados(salaoId, data);
  const agora = Date.now();

  const abertura = minutosDaHora(janela.horaAbertura);
  const fechamento = minutosDaHora(janela.horaFechamento);
  const slots: Slot[] = [];

  for (let minuto = abertura; minuto + servico.duracaoMin <= fechamento; minuto += servico.duracaoMin) {
    const hora = horaDeMinutos(minuto);
    const instante = instanteDe(data, hora);

    slots.push({
      hora,
      dataHora: instante.toISOString(),
      // Horário no passado não é oferecido, mesmo estando livre na agenda.
      livre: !ocupados.has(hora) && instante.getTime() > agora,
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

/** Horas ("HH:MM") já tomadas no salão naquele dia. */
async function horariosOcupados(salaoId: string, data: string): Promise<Set<string>> {
  const agendamentos = await prisma.agendamento.findMany({
    where: {
      salaoId,
      status: { in: [...STATUS_QUE_OCUPAM] },
      // Intervalo do dia local, convertido para instantes.
      dataHora: { gte: instanteDe(data, "00:00"), lt: instanteDe(proximoDia(data), "00:00") },
    },
    select: { dataHora: true },
  });

  return new Set(agendamentos.map((agendamento) => localDe(agendamento.dataHora).hora));
}

/** "2026-10-05" → "2026-10-06", respeitando viradas de mês e ano. */
function proximoDia(data: string): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  const seguinte = new Date(Date.UTC(ano, mes - 1, dia + 1));
  return seguinte.toISOString().slice(0, 10);
}
