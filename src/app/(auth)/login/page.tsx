import type { Metadata } from "next";
import Link from "next/link";
import { googleHabilitado } from "@/auth";
import { FormularioLogin } from "./formulario-login";
import { BotaoGoogle } from "../botao-google";

export const metadata: Metadata = { title: "Entrar | MeuSalão" };

export default function LoginPage() {
  return (
    <>
      <h2 className="mb-1 text-3xl font-black tracking-tight">Entrar</h2>
      <p className="mb-8 text-muted-foreground">Acesse sua conta para agendar</p>

      <FormularioLogin />

      {googleHabilitado && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>
          <BotaoGoogle rotulo="Entrar com Google" />
        </>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-primary hover:underline">
          Cadastre-se
        </Link>
      </p>
    </>
  );
}
