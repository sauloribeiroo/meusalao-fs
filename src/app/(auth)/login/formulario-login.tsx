"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LogIn } from "lucide-react";
import { entrarAction, type EstadoFormulario } from "@/acoes/sessao";
import { Campo } from "@/components/campo";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";

const ESTADO_INICIAL: EstadoFormulario = {};

export function FormularioLogin() {
  const [estado, action] = useActionState(entrarAction, ESTADO_INICIAL);
  const valores = estado.valores ?? {};

  return (
    // key: o React limpa o formulário depois da action; assim o e-mail
    // digitado continua na tela quando a senha está errada.
    <form key={JSON.stringify(valores)} action={action} className="space-y-4" noValidate>
      <Campo label="E-mail" name="email" type="email" autoComplete="email" required defaultValue={valores.email} />
      <Campo label="Senha" name="senha" type="password" autoComplete="current-password" required />

      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

      <BotaoEntrar />
    </form>
  );
}

function BotaoEntrar() {
  // useFormStatus só enxerga o <form> acima dele — por isso o botão é um componente à parte.
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      <LogIn aria-hidden />
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}
