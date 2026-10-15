"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { CheckCircle2, KeyRound } from "lucide-react";
import { redefinirSenhaAction, type EstadoRecuperacao } from "@/acoes/recuperacao";
import { Campo } from "@/components/campo";
import { AlertaErro } from "@/components/ui/alerta";
import { Button, buttonVariants } from "@/components/ui/button";

const INICIAL: EstadoRecuperacao = {};

/** RF05 — segunda etapa: definir a nova senha. */
export function FormularioRedefinir({ token }: { token: string }) {
  const [estado, acao] = useActionState(redefinirSenhaAction, INICIAL);

  if (estado.redefinida) {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
        <div>
          <p className="text-lg font-semibold">Senha redefinida</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use a nova senha para entrar na sua conta.
          </p>
        </div>
        <Link href="/login" className={buttonVariants({ size: "lg", className: "w-full" })}>
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />

      <Campo
        label="Nova senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        required
        erro={estado.erros?.senha?.[0]}
      />
      <Campo
        label="Repita a nova senha"
        name="confirmacao"
        type="password"
        autoComplete="new-password"
        required
        erro={estado.erros?.confirmacao?.[0]}
      />

      <p className="text-xs text-muted-foreground">
        A senha precisa ter ao menos 8 caracteres, com letras e números.
      </p>

      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

      <BotaoRedefinir />
    </form>
  );
}

function BotaoRedefinir() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      <KeyRound aria-hidden />
      {pending ? "Salvando..." : "Salvar nova senha"}
    </Button>
  );
}
