import { z } from "zod";

export const novoAgendamentoSchema = z.object({
  salaoId: z.string().trim().min(1, "Informe o salão"),
  servicoId: z.string().trim().min(1, "Informe o serviço"),
  /** Instante ISO, exatamente como veio do slot em /api/disponibilidade. */
  dataHora: z
    .string()
    .trim()
    .min(1, "Informe o horário")
    .refine((valor) => !Number.isNaN(Date.parse(valor)), "Horário inválido"),
});

/**
 * Transições que o salão pode aplicar (RF25). "recusar" e "cancelar" levam ao
 * mesmo status final; são verbos distintos só para a UI e para o log de quem agiu.
 */
export const ACOES_DO_SALAO = ["confirmar", "recusar", "concluir"] as const;

export const acaoDoSalaoSchema = z.object({
  acao: z.enum(ACOES_DO_SALAO, {
    errorMap: () => ({ message: `Ação inválida (use: ${ACOES_DO_SALAO.join(", ")})` }),
  }),
});

export type NovoAgendamento = z.infer<typeof novoAgendamentoSchema>;
export type AcaoDoSalao = (typeof ACOES_DO_SALAO)[number];
