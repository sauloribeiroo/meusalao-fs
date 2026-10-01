import { z } from "zod";

export const novoServicoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "O nome deve ter ao menos 2 caracteres")
    .max(120, "O nome deve ter no máximo 120 caracteres"),
  preco: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined))
    .transform((valor) => (valor ? valor.replace(",", ".") : undefined))
    .pipe(z.coerce.number().positive("O preço deve ser maior que zero").optional()),
  duracaoMin: z.coerce
    .number({ message: "Informe a duração" })
    .int("A duração deve ser em minutos inteiros")
    .positive("A duração deve ser maior que zero")
    .max(600, "A duração deve ser no máximo 600 minutos"),
});

export type NovoServico = z.infer<typeof novoServicoSchema>;
