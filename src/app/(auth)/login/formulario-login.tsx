"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { entrarAction, type EstadoFormulario } from "@/acoes/sessao";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ESTADO_INICIAL: EstadoFormulario = {};

export function FormularioLogin() {
  const [estado, action] = useActionState(entrarAction, ESTADO_INICIAL);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const valores = estado.valores ?? {};

  const erroEmail = estado.erros?.email?.[0];
  const erroSenha = estado.erros?.senha?.[0];

  return (
    <form action={action} className="space-y-4" noValidate suppressHydrationWarning>
      {/* Campo E-mail */}
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          E-mail
        </Label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          suppressHydrationWarning
          defaultValue={valores.email}
          placeholder="seu@email.com"
          aria-invalid={Boolean(erroEmail)}
          aria-describedby={erroEmail ? "email-erro" : undefined}
          className={`flex h-12 w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 ${
            erroEmail
              ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/15"
              : "border-gray-200"
          }`}
        />
        {erroEmail && (
          <p id="email-erro" className="text-xs font-medium text-destructive">
            {erroEmail}
          </p>
        )}
      </div>

      {/* Campo Senha */}
      <div className="space-y-1.5">
        <Label htmlFor="senha" className="text-sm font-medium text-foreground">
          Senha
        </Label>
        <div className="relative">
          <input
            id="senha"
            name="senha"
            type={mostrarSenha ? "text" : "password"}
            autoComplete="current-password"
            required
            suppressHydrationWarning
            placeholder="Digite sua senha"
            aria-invalid={Boolean(erroSenha)}
            aria-describedby={erroSenha ? "senha-erro" : undefined}
            className={`flex h-12 w-full rounded-xl border bg-white px-3.5 pr-11 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 ${
              erroSenha
                ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/15"
                : "border-gray-200"
            }`}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            aria-label={mostrarSenha ? "Ocultar senha" : "Ver senha"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {mostrarSenha ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {erroSenha && (
          <p id="senha-erro" className="text-xs font-medium text-destructive">
            {erroSenha}
          </p>
        )}
        <p className="pt-0.5 text-right">
          <Link
            href="/esqueci-senha"
            className="text-sm font-medium text-primary hover:underline hover:text-primary/90"
          >
            Esqueci minha senha
          </Link>
        </p>
      </div>

      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

      <BotaoEntrar />
    </form>
  );
}

function BotaoEntrar() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span>Entrando...</span>
        </>
      ) : (
        <>
          <LogIn className="size-4" aria-hidden="true" />
          <span>Entrar</span>
        </>
      )}
    </Button>
  );
}
