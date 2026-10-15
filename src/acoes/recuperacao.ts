"use server";

import { headers } from "next/headers";
import { ErroDeNegocio, ErroDeValidacao } from "@/services/erros";
import { redefinirSenha, solicitarRecuperacao } from "@/services/usuarios/recuperacao.service";

/** RF05 — ações das telas de recuperação de senha. */

export type EstadoRecuperacao = {
  mensagem?: string;
  erros?: Record<string, string[]>;
  valores?: Record<string, string>;
  enviado?: boolean;
  redefinida?: boolean;
};

/** URL pública da aplicação, para montar o link do e-mail. */
async function urlBase(): Promise<string> {
  const cabecalhos = await headers();
  const host = cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host") ?? "localhost:3000";
  const protocolo = cabecalhos.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return `${protocolo}://${host}`;
}

export async function solicitarRecuperacaoAction(
  _estado: EstadoRecuperacao,
  formData: FormData,
): Promise<EstadoRecuperacao> {
  const email = String(formData.get("email") ?? "");

  try {
    await solicitarRecuperacao({ email }, await urlBase());
  } catch (erro) {
    if (erro instanceof ErroDeValidacao) return { valores: { email }, erros: erro.erros };

    console.error("Falha ao solicitar recuperação de senha:", erro);
    return { valores: { email }, mensagem: "Não foi possível enviar o e-mail. Tente novamente." };
  }

  // Confirmação igual exista ou não a conta: a tela não revela quem é cadastrado.
  return { enviado: true };
}

export async function redefinirSenhaAction(
  _estado: EstadoRecuperacao,
  formData: FormData,
): Promise<EstadoRecuperacao> {
  const dados = {
    token: String(formData.get("token") ?? ""),
    senha: String(formData.get("senha") ?? ""),
    confirmacao: String(formData.get("confirmacao") ?? ""),
  };

  try {
    await redefinirSenha(dados);
  } catch (erro) {
    if (erro instanceof ErroDeValidacao) return { erros: erro.erros };
    if (erro instanceof ErroDeNegocio) return { mensagem: erro.message };

    console.error("Falha ao redefinir senha:", erro);
    return { mensagem: "Não foi possível redefinir a senha. Tente novamente." };
  }

  return { redefinida: true };
}
