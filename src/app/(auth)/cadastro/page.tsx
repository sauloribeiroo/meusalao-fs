import type { Metadata } from "next";
import Link from "next/link";
import { googleHabilitado } from "@/auth";
import { FormularioCadastro } from "./formulario-cadastro";
import { BotaoGoogle } from "../botao-google";

export const metadata: Metadata = { title: "Criar conta | MeuSalão" };

export default function CadastroPage() {
  return (
    <>
      <h2 className="mb-1 text-3xl font-black tracking-tight">Criar conta</h2>
      <p className="mb-8 text-muted-foreground">Leva menos de um minuto</p>

      <FormularioCadastro />

      {googleHabilitado && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>
          <BotaoGoogle rotulo="Cadastrar com Google" />
        </>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
