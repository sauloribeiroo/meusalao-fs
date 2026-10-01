import { z } from "zod";

export const novoAgendamentoSchema = z.object({
  salaoId: z.string().trim().min(1, "Salão inválido"),
  servicoId: z.string().trim().min(1, "Serviço inválido"),
  dataHora: z.coerce.date({ message: "Data e horário inválidos" }),
});

export type NovoAgendamento = z.infer<typeof novoAgendamentoSchema>;
