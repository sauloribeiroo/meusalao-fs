"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { ErroDeConflito, ErroDeValidacao } from "@/services/erros";
import { cadastrarUsuario } from "@/services/usuarios/usuarios.service";

export type EstadoFormulario = {
  /** Erro geral do formulário (credenciais, indisponibilidade). */
  mensagem?: string;
  /** Mensagens por campo, no formato devolvido pelo Zod. */
  erros?: Record<string, string[]>;
};

const ROTA_APOS_LOGIN = "/inicio";

export async function entrarAction(_estado: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      senha: formData.get("senha"),
      redirect: false,
    });
  } catch (erro) {
    if (erro instanceof AuthError) {
      return {
        mensagem:
          erro.type === "CredentialsSignin"
            ? "E-mail ou senha incorretos"
            : "Não foi possível entrar. Tente novamente.",
      };
    }

    console.error("Falha no login:", erro);
    return { mensagem: "Não foi possível entrar. Tente novamente." };
  }

  // Fora do try: redirect() sinaliza o desvio lançando um erro.
  redirect(ROTA_APOS_LOGIN);
}

export async function cadastrarAction(_estado: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const dados = Object.fromEntries(formData);

  try {
    await cadastrarUsuario(dados);
    // Conta criada: já entra com as mesmas credenciais.
    await signIn("credentials", { email: dados.email, senha: dados.senha, redirect: false });
  } catch (erro) {
    if (erro instanceof ErroDeValidacao) return { erros: erro.erros };
    if (erro instanceof ErroDeConflito) return { erros: { email: [erro.message] } };

    console.error("Falha no cadastro:", erro);
    return { mensagem: "Não foi possível criar a conta. Tente novamente." };
  }

  redirect(ROTA_APOS_LOGIN);
}

/** Login social: o próprio Auth.js redireciona para o Google. */
export async function entrarComGoogleAction() {
  await signIn("google", { redirectTo: ROTA_APOS_LOGIN });
}

export async function sairAction() {
  await signOut({ redirectTo: "/login" });
}
