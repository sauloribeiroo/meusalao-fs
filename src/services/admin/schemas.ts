import { z } from "zod";

/** RF26 — entradas do módulo administrativo. */

export const PAPEIS = ["CLIENTE", "DONO_SALAO", "ADMIN"] as const;

export const alteracaoDePapelSchema = z.object({
  usuarioId: z.string().trim().min(1, "Informe o usuário"),
  papel: z.enum(PAPEIS, {
    errorMap: () => ({ message: `Papel inválido (use: ${PAPEIS.join(", ")})` }),
  }),
});

export const moderacaoDeSalaoSchema = z.object({
  salaoId: z.string().trim().min(1, "Informe o salão"),
  publicado: z.union([z.boolean(), z.enum(["true", "false"])]).transform((v) => v === true || v === "true"),
});

export const buscaAdminSchema = z.object({
  termo: z.string().trim().max(120).optional(),
  papel: z.enum(PAPEIS).optional(),
});

export type AlteracaoDePapel = z.infer<typeof alteracaoDePapelSchema>;
export type BuscaAdmin = z.infer<typeof buscaAdminSchema>;
