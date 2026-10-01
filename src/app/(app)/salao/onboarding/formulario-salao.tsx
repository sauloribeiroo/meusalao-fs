"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Store } from "lucide-react";
import { criarSalaoAction, type EstadoFormularioSalao } from "@/acoes/saloes";
import { Campo } from "@/components/campo";
import { GradeHorarios } from "@/components/grade-horarios";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";

const ESTADO_INICIAL: EstadoFormularioSalao = {};

export function FormularioSalao() {
  const [estado, action] = useActionState(criarSalaoAction, ESTADO_INICIAL);
  const erros = estado.erros ?? {};

  return (
    <form action={action} className="mt-8 space-y-6" noValidate>
      <div className="space-y-4">
        <Campo label="Nome do salão" name="nome" required erro={erros.nome?.[0]} />
        <Campo label="Endereço" name="endereco" required erro={erros.endereco?.[0]} />
        <Campo label="Telefone (opcional)" name="telefone" type="tel" autoComplete="tel" erro={erros.telefone?.[0]} />
      </div>

      <fieldset>
        <GradeHorarios />
        {erros.horarios && <p className="mt-2 text-xs text-destructive">{erros.horarios[0]}</p>}
      </fieldset>

      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

      <BotaoCriar />
    </form>
  );
}

function BotaoCriar() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      <Store aria-hidden />
      {pending ? "Criando salão..." : "Criar salão"}
    </Button>
  );
}
