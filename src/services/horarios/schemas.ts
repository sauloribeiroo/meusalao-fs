import { z } from "zod";
import { horaValida, minutosDaHora } from "@/services/horarios/tempo";

const DIAS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"] as const;

const hora = z.string().trim().refine(horaValida, "Horário inválido (use HH:MM, ex.: 09:00)");

const horarioDoDiaSchema = z
  .object({
    diaSemana: z.enum(DIAS, { errorMap: () => ({ message: "Dia da semana inválido" }) }),
    horaAbertura: hora,
    horaFechamento: hora,
    ativo: z.boolean().default(true),
  })
  .refine((dia) => minutosDaHora(dia.horaFechamento) > minutosDaHora(dia.horaAbertura), {
    message: "O fechamento deve ser depois da abertura",
    path: ["horaFechamento"],
  });

/**
 * RF22 — a semana inteira chega de uma vez. Substituir tudo é mais simples (e
 * mais previsível para a tela) do que casar criação, edição e remoção dia a dia.
 * Replicar para os dias úteis é trabalho da UI: ela monta as sete entradas.
 */
export const horariosDaSemanaSchema = z.object({
  horarios: z
    .array(horarioDoDiaSchema)
    .max(7, "Há no máximo sete dias na semana")
    .refine((lista) => new Set(lista.map((dia) => dia.diaSemana)).size === lista.length, {
      message: "Há mais de um horário para o mesmo dia da semana",
    }),
});

export type HorarioDoDia = z.infer<typeof horarioDoDiaSchema>;
export type HorariosDaSemana = z.infer<typeof horariosDaSemanaSchema>;
