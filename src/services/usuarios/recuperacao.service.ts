import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { enviarEmail } from "@/services/email";
import { ErroDeNegocio, ErroDeValidacao } from "@/services/erros";
import { redefinicaoSchema, solicitacaoSchema } from "@/services/usuarios/schemas";

/**
 * RF05 — recuperação de senha.
 *
 * Decisões de segurança do fluxo:
 *  - a tabela guarda só o hash do token, então ler o banco não dá acesso a nada;
 *  - o token vale uma hora e uma vez só;
 *  - pedir um token novo invalida os anteriores;
 *  - a solicitação responde igual para e-mail existente e inexistente, para a
 *    tela não virar um verificador de quem tem conta na plataforma.
 */

const VALIDADE_MIN = 60;
const RODADAS_HASH = 10;

/** SHA-256 basta: o token é aleatório de 256 bits, não uma senha adivinhável. */
const hashDoToken = (token: string) => createHash("sha256").update(token).digest("hex");

export class ErroDeTokenInvalido extends ErroDeNegocio {
  constructor() {
    super("Este link de recuperação é inválido ou expirou. Peça um novo.", "TOKEN_INVALIDO");
    this.name = "ErroDeTokenInvalido";
  }
}

/**
 * Cria o token e dispara o e-mail. Devolve sempre o mesmo resultado, exista ou
 * não a conta — quem chama não consegue distinguir os dois casos.
 */
export async function solicitarRecuperacao(dados: unknown, urlBase: string): Promise<void> {
  const resultado = solicitacaoSchema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { email } = resultado.data;
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true, nome: true, senhaHash: true },
  });

  // Conta só de login social não tem senha para redefinir.
  if (!usuario?.senhaHash) return;

  const token = randomBytes(32).toString("base64url");

  await prisma.$transaction([
    // Um pedido novo cancela os anteriores, para não deixar vários links vivos.
    prisma.tokenSenha.deleteMany({ where: { usuarioId: usuario.id, usadoEm: null } }),
    prisma.tokenSenha.create({
      data: {
        usuarioId: usuario.id,
        tokenHash: hashDoToken(token),
        expiraEm: new Date(Date.now() + VALIDADE_MIN * 60_000),
      },
    }),
  ]);

  const link = `${urlBase}/redefinir-senha?token=${token}`;

  await enviarEmail({
    para: email,
    assunto: "Redefinição de senha — MeuSalão",
    texto: [
      `Olá, ${usuario.nome}.`,
      "",
      "Recebemos um pedido para redefinir a senha da sua conta no MeuSalão.",
      "Abra o link abaixo para escolher uma nova senha:",
      "",
      link,
      "",
      `O link vale por ${VALIDADE_MIN} minutos e só pode ser usado uma vez.`,
      "Se não foi você que pediu, ignore esta mensagem — sua senha continua a mesma.",
    ].join("\n"),
  });
}

/** Confere o token sem consumi-lo, para a tela decidir se mostra o formulário. */
export async function tokenEhValido(token: string): Promise<boolean> {
  const registro = await prisma.tokenSenha.findUnique({
    where: { tokenHash: hashDoToken(token) },
    select: { expiraEm: true, usadoEm: true },
  });

  return Boolean(registro && !registro.usadoEm && registro.expiraEm > new Date());
}

/** Troca a senha e consome o token. */
export async function redefinirSenha(dados: unknown): Promise<void> {
  const resultado = redefinicaoSchema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { token, senha } = resultado.data;

  const registro = await prisma.tokenSenha.findUnique({
    where: { tokenHash: hashDoToken(token) },
    select: { id: true, usuarioId: true, expiraEm: true, usadoEm: true },
  });

  if (!registro || registro.usadoEm || registro.expiraEm <= new Date()) throw new ErroDeTokenInvalido();

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: registro.usuarioId },
      data: { senhaHash: await bcrypt.hash(senha, RODADAS_HASH) },
    }),
    prisma.tokenSenha.update({ where: { id: registro.id }, data: { usadoEm: new Date() } }),
  ]);
}
