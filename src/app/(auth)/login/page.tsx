import type { Metadata } from "next";
import Link from "next/link";
import { ScissorsLineDashed } from "lucide-react";
import { BotaoGoogle } from "../botao-google";
import { FormularioLogin } from "./formulario-login";

export const metadata: Metadata = { title: "Entrar | MeuSalão" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-[420px] rounded-[16px] bg-white p-6 sm:p-8 shadow-xl shadow-purple-950/5 border border-purple-100/80">
      {/* Topo do card: Logo MeuSalão com ícone de tesoura roxo */}
      <div className="mb-6 flex items-center justify-center gap-2.5 text-primary">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ScissorsLineDashed className="size-5 stroke-[2]" aria-hidden="true" />
        </div>
        <span className="text-2xl font-extrabold tracking-tight text-primary">
          Meu<span className="font-light tracking-wide text-primary/85">Salão</span>
        </span>
      </div>

      {/* Cabeçalho */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Entrar</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Acesse sua conta para agendar seu horário</p>
      </div>

      {/* Formulário com credenciais */}
      <FormularioLogin />

      {/* Separador 'ou' */}
      <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase text-muted-foreground">
        <span className="h-px flex-1 bg-gray-200" />
        ou
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Botão Entrar com Google */}
      <BotaoGoogle rotulo="Entrar com Google" />

      {/* Rodapé com link de cadastro */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-primary hover:underline hover:text-primary/90">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
