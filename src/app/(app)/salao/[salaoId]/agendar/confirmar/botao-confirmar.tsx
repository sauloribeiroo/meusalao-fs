"use client";

import { useActionState } from "react";
import { CalendarCheck } from "lucide-react";
import { agendarAction, type EstadoAgendamento } from "@/acoes/agendamentos";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";

const INICIAL: EstadoAgendamento = {};

/** RF16 — confirmação do agendamento revisado. */
export function BotaoConfirmar({
  salaoId,
  servicoId,
  dataHora,
}: {
  salaoId: string;
  servicoId: string;
  dataHora: string;
}) {
  const [estado, acao, enviando] = useActionState(agendarAction, INICIAL);

  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="salaoId" value={salaoId} />
      <input type="hidden" name="servicoId" value={servicoId} />
      <input type="hidden" name="dataHora" value={dataHora} />

      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

      <Button type="submit" size="lg" className="w-full" disabled={enviando}>
        <CalendarCheck aria-hidden />
        {enviando ? "Confirmando..." : "Confirmar agendamento"}
      </Button>
    </form>
  );
}
