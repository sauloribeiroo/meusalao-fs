"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { MailCheck, Send } from "lucide-react";
import { solicitarRecuperacaoAction, type EstadoRecuperacao } from "@/acoes/recuperacao";
import { Campo } from "@/components/campo";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";

const INICIAL: EstadoRecuperacao = {};

/** RF05 — pedido do link de recuperação. */
export function FormularioEsqueci({ avisoDeDesenvolvimento }: { avisoDeDesenvolvimento: boolean }) {
  const [estado, acao] = useActionState(solicitarRecuperacaoAction, INICIAL);

  if (estado.enviado) {
    return (
      <div className="space-y-4">
        <p className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
          <MailCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha. O link vale
            por uma hora.
          </span>
        </p>

        {avisoDeDesenvolvimento && (
          <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-900">
            Ambiente de desenvolvimento: ainda não há serviço de e-mail configurado. O link foi
            escrito no terminal onde o servidor está rodando.
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-4" noValidate>
      <Campo
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={estado.valores?.email}
        erro={estado.erros?.email?.[0]}
      />

      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

      <BotaoEnviar />
    </form>
  );
}

function BotaoEnviar() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      <Send aria-hidden />
      {pending ? "Enviando..." : "Enviar link de recuperação"}
    </Button>
  );
}
