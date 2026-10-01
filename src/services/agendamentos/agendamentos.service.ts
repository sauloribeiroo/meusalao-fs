import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { gerarSlotsDisponiveis } from "@/services/agendamentos/disponibilidade.service";
import { novoAgendamentoSchema } from "@/services/agendamentos/schemas";
import { ErroDeConflito, ErroDeValidacao } from "@/services/erros";

/**
 * Cria o agendamento após confirmar que o horário está dentro do
 * funcionamento do salão e livre. A constraint única (salaoId, dataHora) é a
 * última linha de defesa contra condição de corrida entre a checagem e a
 * escrita — se outro cliente reservou o mesmo instante nesse meio-tempo, o
 * banco rejeita e traduzimos em erro de conflito.
 */
export async function criarAgendamento(clienteId: string, dados: unknown) {
  const resultado = novoAgendamentoSchema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { salaoId, servicoId, dataHora } = resultado.data;

  const servico = await prisma.servico.findUnique({ where: { id: servicoId }, select: { salaoId: true, duracaoMin: true } });
  if (!servico || servico.salaoId !== salaoId) {
    throw new ErroDeValidacao({ servicoId: ["Serviço inválido para este salão"] });
  }

  const slots = await gerarSlotsDisponiveis(salaoId, dataHora, servico.duracaoMin);
  const horarioAlvo = dataHora.toTimeString().slice(0, 5);
  const slot = slots.find((s) => s.horario === horarioAlvo);
  if (!slot || slot.ocupado) {
    throw new ErroDeConflito("Esse horário não está mais disponível");
  }

  try {
    return await prisma.agendamento.create({ data: { clienteId, salaoId, servicoId, dataHora } });
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      throw new ErroDeConflito("Esse horário acabou de ser reservado por outra pessoa");
    }
    throw erro;
  }
}

export async function buscarAgendamentoDoCliente(id: string, clienteId: string) {
  return prisma.agendamento.findFirst({
    where: { id, clienteId },
    include: { salao: true, servico: true },
  });
}
