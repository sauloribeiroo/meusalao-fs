import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ErroDeConflito, ErroDeCredenciais, ErroDeValidacao } from "@/services/erros";
import { credenciaisSchema, novoUsuarioSchema } from "@/services/usuarios/schemas";

const RODADAS_HASH = 10;

/** Usuário como ele trafega para a sessão e para a UI — nunca inclui a senha. */
export type UsuarioPublico = {
  id: string;
  nome: string;
  email: string;
  papel: "CLIENTE" | "DONO_SALAO" | "ADMIN";
  imagem: string | null;
};

const paraPublico = (usuario: {
  id: string;
  nome: string;
  email: string;
  papel: UsuarioPublico["papel"];
  imagem: string | null;
}): UsuarioPublico => ({
  id: usuario.id,
  nome: usuario.nome,
  email: usuario.email,
  papel: usuario.papel,
  imagem: usuario.imagem,
});

/**
 * Cadastro por e-mail/senha. Valida os dados, garante e-mail único e guarda
 * apenas o hash da senha.
 */
export async function cadastrarUsuario(dados: unknown): Promise<UsuarioPublico> {
  const resultado = novoUsuarioSchema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { nome, email, telefone, senha } = resultado.data;

  if (await prisma.usuario.findUnique({ where: { email }, select: { id: true } })) {
    throw new ErroDeConflito("Já existe uma conta com este e-mail");
  }

  const usuario = await prisma.usuario.create({
    data: { nome, email, telefone, senhaHash: await bcrypt.hash(senha, RODADAS_HASH) },
  });

  return paraPublico(usuario);
}

/**
 * Confere e-mail e senha. Devolve o usuário quando as credenciais batem e
 * lança ErroDeCredenciais em qualquer outro caso — inclusive quando a conta
 * existe mas só tem login social, para não revelar quais e-mails estão cadastrados.
 */
export async function autenticarUsuario(credenciais: unknown): Promise<UsuarioPublico> {
  const resultado = credenciaisSchema.safeParse(credenciais);
  if (!resultado.success) throw new ErroDeCredenciais();

  const { email, senha } = resultado.data;
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Compara mesmo sem usuário/hash para manter o tempo de resposta parecido.
  const hash = usuario?.senhaHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi";
  const confere = await bcrypt.compare(senha, hash);

  if (!usuario?.senhaHash || !confere) throw new ErroDeCredenciais();

  return paraPublico(usuario);
}

/**
 * Login social: cria o usuário na primeira entrada e reaproveita a conta
 * existente quando o e-mail já foi cadastrado por e-mail/senha.
 */
export async function vincularContaSocial(params: {
  provedor: string;
  idNoProvedor: string;
  nome: string;
  email: string;
  imagem?: string | null;
}): Promise<UsuarioPublico> {
  const email = params.email.trim().toLowerCase();

  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: { imagem: params.imagem ?? undefined },
    create: { nome: params.nome, email, imagem: params.imagem ?? undefined },
  });

  await prisma.conta.upsert({
    where: { provedor_idNoProvedor: { provedor: params.provedor, idNoProvedor: params.idNoProvedor } },
    update: { usuarioId: usuario.id },
    create: { provedor: params.provedor, idNoProvedor: params.idNoProvedor, usuarioId: usuario.id },
  });

  return paraPublico(usuario);
}

export async function buscarUsuarioPorId(id: string): Promise<UsuarioPublico | null> {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  return usuario ? paraPublico(usuario) : null;
}
