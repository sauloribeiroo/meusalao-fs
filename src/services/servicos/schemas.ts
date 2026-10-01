import { z } from "zod";

/** Aceita "80", "80.5" e "80,50" — o formulário é brasileiro, o banco não. */
const preco = z
  .union([z.number(), z.string()])
  .transform((valor, ctx) => {
    if (typeof valor === "number") return valor;

    const limpo = valor.trim().replace(/\s/g, "").replace(",", ".");
    if (limpo === "") return undefined;

    const numero = Number(limpo);
    if (Number.isNaN(numero)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Preço inválido" });
      return z.NEVER;
    }

    return numero;
  })
  .pipe(
    z
      .number()
      .nonnegative("O preço não pode ser negativo")
      .max(99999.99, "Preço acima do limite")
      .optional(),
  )
  .optional()
  // RGN06: sem preço é um caso válido — a vitrine exibe "Consultar preço".
  .nullable();

export const novoServicoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "O nome do serviço deve ter ao menos 2 caracteres")
    .max(120, "O nome do serviço deve ter no máximo 120 caracteres"),
  preco,
  duracaoMin: z.coerce
    .number()
    .int("A duração deve ser em minutos inteiros")
    .min(5, "A duração mínima é de 5 minutos")
    .max(600, "A duração máxima é de 600 minutos (10 horas)"),
});

/** Na edição todo campo é opcional, mas ao menos um precisa vir. */
export const edicaoServicoSchema = novoServicoSchema
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, { message: "Informe ao menos um campo para atualizar" });

export type NovoServico = z.infer<typeof novoServicoSchema>;
export type EdicaoServico = z.infer<typeof edicaoServicoSchema>;
