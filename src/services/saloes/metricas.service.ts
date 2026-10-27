import { prisma } from "@/lib/prisma";
import { resumoDeAvaliacoes, type ResumoDeAvaliacoes } from "@/services/avaliacoes/avaliacoes.service";
import { STATUS_QUE_OCUPAM } from "@/services/agendamentos/disponibilidade.service";
import {
  listarAgendamentosDoSalao,
  type AgendamentoPublico,
} from "@/services/agendamentos/agendamentos.service";
import { instanteDe, localDe } from "@/services/horarios/tempo";

/**
 * RF24 — métricas do dashboard do salão.
 *
 * Todas as janelas são recortadas no fuso do salão, não no relógio do servidor:
 * "hoje" é o dia do salão, e na Vercel o processo roda em UTC. Sem isso, das
 * 21h às 24h de Fortaleza o dashboard já estaria mostrando o dia seguinte.
 */

export type MetricasDoSalao = {
  /** Dia de referência no fuso do salão, em AAAA-MM-DD. */
  hoje: string;
  agendamentosHoje: number;
  agendamentosSemana: number;
  /** Pedidos aguardando confirmação do salão (RF25) — é o que exige ação. */
  pendentes: number;
  /** Clientes distintos já atendidos, em toda a história do salão. */
  clientesAtendidos: number;
  /** Soma dos serviços concluídos nos últimos 30 dias. */
  receitaMes: number;
  /**
   * Quantos concluídos no período não entraram na receita por não terem preço
   * cadastrado (RGN06). Sem isso o número pareceria simplesmente baixo.
   */
  concluidosSemPreco: number;
  avaliacoes: ResumoDeAvaliacoes;
  agendaDoDia: AgendamentoPublico[];
};

/** Soma de dias sobre uma data local "AAAA-MM-DD", sem passar por fuso. */
function somarDias(data: string, dias: number): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10);
}

/** Meia-noite local do salão, como instante absoluto. */
const inicioDoDia = (data: string): Date => instanteDe(data, "00:00");

export async function metricasDoSalao(salaoId: string): Promise<MetricasDoSalao> {
  const { data: hoje } = localDe(new Date());

  const inicioHoje = inicioDoDia(hoje);
  const inicioAmanha = inicioDoDia(somarDias(hoje, 1));
  // Semana corrente = os 7 dias que terminam hoje, inclusive.
  const inicioSemana = inicioDoDia(somarDias(hoje, -6));
  const inicioMes = inicioDoDia(somarDias(hoje, -29));

  const ocupam = { in: [...STATUS_QUE_OCUPAM] };

  const [agendamentosHoje, agendamentosSemana, pendentes, clientes, concluidosDoMes, avaliacoes, agendaDoDia] =
    await Promise.all([
      prisma.agendamento.count({
        where: { salaoId, status: ocupam, dataHora: { gte: inicioHoje, lt: inicioAmanha } },
      }),
      prisma.agendamento.count({
        where: { salaoId, status: ocupam, dataHora: { gte: inicioSemana, lt: inicioAmanha } },
      }),
      prisma.agendamento.count({ where: { salaoId, status: "PENDENTE" } }),
      // groupBy em vez de count: o que interessa é quantas pessoas distintas,
      // não quantos atendimentos.
      prisma.agendamento.groupBy({
        by: ["clienteId"],
        where: { salaoId, status: "CONCLUIDO" },
      }),
      prisma.agendamento.findMany({
        where: { salaoId, status: "CONCLUIDO", dataHora: { gte: inicioMes, lt: inicioAmanha } },
        select: { servico: { select: { preco: true } } },
      }),
      resumoDeAvaliacoes(salaoId),
      listarAgendamentosDoSalao(salaoId, { data: hoje }),
    ]);

  const precos = concluidosDoMes.map((agendamento) => agendamento.servico.preco);

  return {
    hoje,
    agendamentosHoje,
    agendamentosSemana,
    pendentes,
    clientesAtendidos: clientes.length,
    receitaMes: precos.reduce((total: number, preco) => total + (preco === null ? 0 : Number(preco)), 0),
    concluidosSemPreco: precos.filter((preco) => preco === null).length,
    avaliacoes,
    agendaDoDia,
  };
}
