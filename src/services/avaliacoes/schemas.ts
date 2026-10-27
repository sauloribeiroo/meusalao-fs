import { z } from "zod";

export const NOTA_MINIMA = 1;
export const NOTA_MAXIMA = 5;
export const COMENTARIO_MAXIMO = 500;

export const novaAvaliacaoSchema = z.object({
  agendamentoId: z.string().trim().min(1, "Informe o agendamento"),
  nota: z.coerce
    .number({ invalid_type_error: "Escolha uma nota" })
    .int("A nota é um número inteiro")
    .min(NOTA_MINIMA, `A nota vai de ${NOTA_MINIMA} a ${NOTA_MAXIMA}`)
    .max(NOTA_MAXIMA, `A nota vai de ${NOTA_MINIMA} a ${NOTA_MAXIMA}`),
  // O comentário é opcional (RF19): a nota sozinha já é uma avaliação válida.
  // Campo vazio vindo de formulário chega como "" e vira ausência.
  comentario: z
    .string()
    .trim()
    .max(COMENTARIO_MAXIMO, `O comentário vai até ${COMENTARIO_MAXIMO} caracteres`)
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
});

export type NovaAvaliacao = z.infer<typeof novaAvaliacaoSchema>;
