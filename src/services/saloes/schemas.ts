import { z } from "zod";

const DIAS_SEMANA = ["DOMINGO", "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"] as const;

const horaSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido (ex.: 09:00)");

export const horarioFuncionamentoSchema = z
  .object({
    diaSemana: z.enum(DIAS_SEMANA),
    horaAbertura: horaSchema,
    horaFechamento: horaSchema,
    ativo: z.boolean(),
  })
  .refine((h) => !h.ativo || h.horaAbertura < h.horaFechamento, {
    message: "O horário de abertura deve ser antes do de fechamento",
    path: ["horaFechamento"],
  });

export const novoSalaoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "O nome deve ter ao menos 2 caracteres")
    .max(120, "O nome deve ter no máximo 120 caracteres"),
  endereco: z.string().trim().min(5, "Informe o endereço completo").max(200),
  telefone: z
    .string()
    .trim()
    .regex(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/, "Telefone inválido (ex.: (11) 99999-9999)")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  horarios: z.array(horarioFuncionamentoSchema).length(7, "Informe o horário dos 7 dias da semana"),
});

export const atualizarHorariosSchema = z.object({
  horarios: z.array(horarioFuncionamentoSchema).length(7, "Informe o horário dos 7 dias da semana"),
});

export type NovoSalao = z.infer<typeof novoSalaoSchema>;
export type HorarioFuncionamentoInput = z.infer<typeof horarioFuncionamentoSchema>;
