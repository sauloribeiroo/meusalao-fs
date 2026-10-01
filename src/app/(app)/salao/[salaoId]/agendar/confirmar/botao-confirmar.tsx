"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { criarAgendamentoAction, type EstadoAgendamento } from "@/acoes/agendamentos";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";

const ESTADO_INICIAL: EstadoAgendamento = {};

export function BotaoConfirmar({ salaoId, servicoId, dataHora }: { salaoId: string; servicoId: string; dataHora: string }) {
  const [estado, action] = useActionState(criarAgendamentoAction, ESTADO_INICIAL);

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="salaoId" value={salaoId} />
      <input type="hidden" name="servicoId" value={servicoId} />
      <input type="hidden" name="dataHora" value={dataHora} />

      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

      <Botao />
    </form>
  );
}

function Botao() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      <CheckCircle2 aria-hidden />
      {pending ? "Confirmando..." : "Confirmar agendamento"}
    </Button>
  );
}
