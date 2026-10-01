import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  ErroDeAutenticacao,
  ErroDeAutorizacao,
  ErroDeConflito,
  ErroDeNegocio,
  ErroDeValidacao,
  ErroNaoEncontrado,
} from "@/services/erros";
import type { UsuarioPublico } from "@/services/usuarios/usuarios.service";

/**
 * Cola entre os Route Handlers e a camada de serviços. Os serviços não conhecem
 * HTTP: lançam erros de negócio, e é aqui que eles viram status e JSON.
 */

/** Status HTTP de cada erro de negócio. Qualquer outro erro vira 500. */
const STATUS_POR_CODIGO: Record<string, number> = {
  VALIDACAO: 422,
  CONFLITO: 409,
  NAO_ENCONTRADO: 404,
  AUTENTICACAO: 401,
  AUTORIZACAO: 403,
  CREDENCIAIS: 401,
};

export type CorpoDeErro = {
  erro: string;
  codigo: string;
  /** Presente só em erro de validação: mensagens agrupadas por campo. */
  campos?: Record<string, string[]>;
};

/** Traduz a exceção em resposta JSON. Erro inesperado nunca vaza para o cliente. */
export function respostaDeErro(erro: unknown): NextResponse<CorpoDeErro> {
  if (erro instanceof ErroDeValidacao) {
    return NextResponse.json(
      { erro: erro.message, codigo: erro.codigo, campos: erro.erros },
      { status: STATUS_POR_CODIGO.VALIDACAO },
    );
  }

  if (erro instanceof ErroDeNegocio) {
    return NextResponse.json(
      { erro: erro.message, codigo: erro.codigo },
      { status: STATUS_POR_CODIGO[erro.codigo] ?? 400 },
    );
  }

  console.error("Erro inesperado na API:", erro);
  return NextResponse.json({ erro: "Erro interno do servidor", codigo: "INTERNO" }, { status: 500 });
}

/** Envolve o handler para que todo erro de negócio vire resposta sem try/catch repetido. */
export function rota<T extends unknown[]>(handler: (...args: T) => Promise<NextResponse>) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (erro) {
      return respostaDeErro(erro);
    }
  };
}

export type UsuarioDaSessao = Pick<UsuarioPublico, "id" | "nome" | "papel">;

/** Exige sessão válida (RNF05). */
export async function exigirSessao(): Promise<UsuarioDaSessao> {
  const sessao = await auth();
  if (!sessao?.user?.id) throw new ErroDeAutenticacao();

  return { id: sessao.user.id, nome: sessao.user.nome, papel: sessao.user.papel };
}

/**
 * Exige sessão com um dos papéis informados. O ADMIN passa em tudo, conforme a
 * RGN07 ("somente o dono do salão ou o administrador").
 */
export async function exigirPapel(...papeis: UsuarioPublico["papel"][]): Promise<UsuarioDaSessao> {
  const usuario = await exigirSessao();
  if (usuario.papel === "ADMIN") return usuario;
  if (!papeis.includes(usuario.papel)) throw new ErroDeAutorizacao();

  return usuario;
}

/** Lê e devolve o corpo JSON da requisição, tratando corpo vazio ou malformado. */
export async function corpoJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ErroDeConflito("Corpo da requisição não é um JSON válido");
  }
}

/** Parâmetro de query obrigatório. */
export function parametroObrigatorio(request: Request, nome: string): string {
  const valor = new URL(request.url).searchParams.get(nome)?.trim();
  if (!valor) throw new ErroDeValidacao({ [nome]: [`Informe o parâmetro "${nome}"`] });

  return valor;
}

export { ErroNaoEncontrado };
