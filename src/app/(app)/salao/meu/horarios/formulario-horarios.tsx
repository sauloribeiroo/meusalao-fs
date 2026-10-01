"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Save } from "lucide-react";
import { atualizarHorariosAction, type EstadoFormularioSalao } from "@/acoes/saloes";
import { GradeHorarios, type DiaHorario } from "@/components/grade-horarios";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";

const ESTADO_INICIAL: EstadoFormularioSalao = {};

export function FormularioHorarios({ salaoId, diasIniciais }: { salaoId: string; diasIniciais: DiaHorario[] }) {
  const [estado, action] = useActionState(atualizarHorariosAction, ESTADO_INICIAL);
  const erros = estado.erros ?? {};

  return (
    <form action={action} className="mt-8 space-y-6" noValidate>
      <input type="hidden" name="salaoId" value={salaoId} />

      <fieldset>
        <GradeHorarios diasIniciais={diasIniciais} />
        {erros.horarios && <p className="mt-2 text-xs text-destructive">{erros.horarios[0]}</p>}
      </fieldset>

      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}
      {estado.sucesso && (
        <p className="flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="size-4" aria-hidden />
          Horários atualizados.
        </p>
      )}

      <BotaoSalvar />
    </form>
  );
}

function BotaoSalvar() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      <Save aria-hidden />
      {pending ? "Salvando..." : "Salvar horários"}
    </Button>
  );
}
