import { z } from "zod";

export const credenciaisSchema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido").toLowerCase(),
  senha: z.string().min(1, "Informe a senha"),
});

export const novoUsuarioSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "O nome deve ter ao menos 3 caracteres")
    .max(120, "O nome deve ter no máximo 120 caracteres"),
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido").toLowerCase(),
  telefone: z
    .string()
    .trim()
    .regex(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/, "Telefone inválido (ex.: (11) 99999-9999)")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  senha: z
    .string()
    .min(8, "A senha deve ter ao menos 8 caracteres")
    .regex(/[A-Za-z]/, "A senha deve conter letras")
    .regex(/\d/, "A senha deve conter números"),
});

export type Credenciais = z.infer<typeof credenciaisSchema>;
export type NovoUsuario = z.infer<typeof novoUsuarioSchema>;
