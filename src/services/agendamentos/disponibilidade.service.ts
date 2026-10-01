import { addMinutes, format, isAfter, isBefore, parse, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";

const INTERVALO_MIN = 30;

const DIAS_SEMANA = ["DOMINGO", "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"] as const;

export type Slot = { horario: string; ocupado: boolean };

function diaSemanaDe(data: Date) {
  return DIAS_SEMANA[data.getDay()];
}

/**
 * Gera os horários possíveis de um salão num dia, marcando quais já estão
 * ocupados por um agendamento confirmado. Considera a duração do serviço
 * para não oferecer um horário que invadiria o próximo compromisso.
 */
export async function gerarSlotsDisponiveis(salaoId: string, data: Date, duracaoServicoMin: number): Promise<Slot[]> {
  const inicioDoDia = startOfDay(data);

  const horario = await prisma.horarioFuncionamento.findUnique({
    where: { salaoId_diaSemana: { salaoId, diaSemana: diaSemanaDe(data) } },
  });
  if (!horario || !horario.ativo) return [];

  const abertura = parse(horario.horaAbertura, "HH:mm", inicioDoDia);
  const fechamento = parse(horario.horaFechamento, "HH:mm", inicioDoDia);

  const agendamentosDoDia = await prisma.agendamento.findMany({
    where: {
      salaoId,
      status: "CONFIRMADO",
      dataHora: { gte: abertura, lt: fechamento },
    },
    include: { servico: { select: { duracaoMin: true } } },
  });

  const ocupados = agendamentosDoDia.map((a) => ({
    inicio: a.dataHora,
    fim: addMinutes(a.dataHora, a.servico.duracaoMin),
  }));

  const slots: Slot[] = [];
  for (let inicio = abertura; isBefore(inicio, fechamento); inicio = addMinutes(inicio, INTERVALO_MIN)) {
    const fimDoServico = addMinutes(inicio, duracaoServicoMin);
    if (isAfter(fimDoServico, fechamento)) break;

    const ocupado = ocupados.some((o) => isBefore(inicio, o.fim) && isAfter(fimDoServico, o.inicio));
    slots.push({ horario: format(inicio, "HH:mm"), ocupado });
  }

  return slots;
}
