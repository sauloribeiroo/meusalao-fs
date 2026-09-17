"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { UserPlus } from "lucide-react";
import { cadastrarAction, type EstadoFormulario } from "@/acoes/sessao";
import { Campo } from "@/components/campo";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";

const ESTADO_INICIAL: EstadoFormulario = {};

export function FormularioCadastro() {
  const [estado, action] = useActionState(cadastrarAction, ESTADO_INICIAL);
  const erros = estado.erros ?? {};
  const valores = estado.valores ?? {};

  return (
    // key: o React limpa formulários não controlados depois de uma action.
    // Recriar os campos com os valores devolvidos evita que o usuário perca
    // o que já tinha digitado quando a validação falha.
    <form key={JSON.stringify(valores)} action={action} className="space-y-4" noValidate>
      <Campo label="Nome" name="nome" autoComplete="name" required defaultValue={valores.nome} erro={erros.nome?.[0]} />
      <Campo
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={valores.email}
        erro={erros.email?.[0]}
      />
      <Campo
        label="Telefone (opcional)"
        name="telefone"
        type="tel"
        autoComplete="tel"
        defaultValue={valores.telefone}
        erro={erros.telefone?.[0]}
      />
      <Campo
        label="Senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        required
        placeholder="Mínimo 8 caracteres, com letras e números"
        erro={erros.senha?.[0]}
      />

      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

      <BotaoCadastrar />
    </form>
  );
}

function BotaoCadastrar() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      <UserPlus aria-hidden />
      {pending ? "Criando conta..." : "Criar conta"}
    </Button>
  );
}
