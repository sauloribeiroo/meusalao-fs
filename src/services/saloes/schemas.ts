import { z } from "zod";

/** Campo de texto opcional: em branco vira null, e não string vazia. */
const textoOpcional = (max: number, mensagem: string) =>
  z
    .string()
    .trim()
    .max(max, mensagem)
    .transform((valor) => (valor === "" ? null : valor))
    .nullable()
    .optional();

/** Coordenada opcional, aceitando número ou o texto que vem do formulário. */
const coordenada = (limite: number, mensagem: string) =>
  z
    .union([z.number(), z.string()])
    .transform((valor, ctx) => {
      if (typeof valor === "number") return valor;

      const limpo = valor.trim().replace(",", ".");
      if (limpo === "") return null;

      const numero = Number(limpo);
      if (Number.isNaN(numero)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: mensagem });
        return z.NEVER;
      }

      return numero;
    })
    .pipe(z.number().min(-limite, mensagem).max(limite, mensagem).nullable())
    .nullable()
    .optional();

/**
 * RF07 — dados do salão que o dono pode editar.
 *
 * `publicado` fica de fora: publicar o perfil é a issue #34, com regra própria
 * (RGN05 exige dados, serviços e horários preenchidos).
 */
export const edicaoSalaoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "O nome do salão deve ter ao menos 2 caracteres")
    .max(120, "O nome do salão deve ter no máximo 120 caracteres"),
  endereco: z
    .string()
    .trim()
    .min(5, "Informe o endereço completo")
    .max(200, "O endereço deve ter no máximo 200 caracteres"),
  descricao: textoOpcional(500, "A descrição deve ter no máximo 500 caracteres"),
  tipo: textoOpcional(60, "O tipo deve ter no máximo 60 caracteres"),
  telefone: z
    .string()
    .trim()
    .transform((valor) => (valor === "" ? null : valor))
    .nullable()
    .optional()
    .refine(
      (valor) => valor == null || /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(valor),
      "Telefone inválido (ex.: (85) 3333-0001)",
    ),
  latitude: coordenada(90, "Latitude inválida (entre -90 e 90)"),
  longitude: coordenada(180, "Longitude inválida (entre -180 e 180)"),
});

export type EdicaoSalao = z.infer<typeof edicaoSalaoSchema>;

/**
 * RF03 — criação do salão. Os campos são os mesmos da edição: o que muda é o
 * efeito (nasce despublicado e promove quem criou a dono), não a validação.
 */
export const novoSalaoSchema = edicaoSalaoSchema;

export type NovoSalao = z.infer<typeof novoSalaoSchema>;

/** Busca de endereço para o mapa (RF03). */
export const buscaDeEnderecoSchema = z.object({
  endereco: z
    .string()
    .trim()
    .min(5, "Digite um endereço com ao menos 5 caracteres")
    .max(200, "O endereço deve ter no máximo 200 caracteres"),
});

/**
 * RF23 — alternar a publicação do salão. Booleano vindo de formulário chega
 * como "true"/"false", então o schema aceita as duas formas.
 */
export const publicacaoSchema = z.object({
  publicado: z.union([z.boolean(), z.enum(["true", "false"])]).transform((valor) => valor === true || valor === "true"),
});
