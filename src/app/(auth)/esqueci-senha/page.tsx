import type { Metadata } from "next";
import Link from "next/link";
import { FormularioEsqueci } from "@/app/(auth)/esqueci-senha/formulario-esqueci";
import { envioDeEmailAtivo } from "@/services/email";

export const metadata: Metadata = { title: "Esqueci minha senha | MeuSalão" };

/** RF05 — primeira etapa: informar o e-mail. */
export default function EsqueciSenhaPage() {
  return (
    <>
      <h2 className="mb-1 text-3xl font-black tracking-tight">Esqueci minha senha</h2>
      <p className="mb-8 text-muted-foreground">
        Informe o e-mail da sua conta e enviamos um link para criar uma nova senha.
      </p>

      <FormularioEsqueci avisoDeDesenvolvimento={!envioDeEmailAtivo} />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
