"use client";

import { useActionState, useState } from "react";
import { X } from "lucide-react";
import { cancelarAgendamentoAction, type EstadoDoCliente } from "@/acoes/meus-agendamentos";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";

const INICIAL: EstadoDoCliente = {};

/**
 * RF18 — cancelamento pelo cliente, com confirmação em dois passos.
 *
 * O horário cancelado volta para a grade e pode ser tomado por outra pessoa em
 * seguida: um clique acidental não se desfaz. Daí o "tem certeza?" antes, em
 * vez de um botão direto.
 */
export function BotaoCancelar({ agendamentoId }: { agendamentoId: string }) {
  const [estado, acao, executando] = useActionState(cancelarAgendamentoAction, INICIAL);
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <div className="space-y-2">
        {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}
        <Button type="button" size="sm" variant="outline" onClick={() => setConfirmando(true)}>
          <X aria-hidden />
          Cancelar agendamento
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

      <p className="text-sm font-medium">Cancelar este agendamento?</p>
      <p className="text-sm text-muted-foreground">
        O horário volta a ficar disponível para outras pessoas.
      </p>

      <div className="flex flex-wrap gap-2">
        <form action={acao}>
          <input type="hidden" name="agendamentoId" value={agendamentoId} />
          <Button type="submit" size="sm" variant="destructive" disabled={executando}>
            {executando ? "Cancelando..." : "Sim, cancelar"}
          </Button>
        </form>
        <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmando(false)}>
          Manter agendamento
        </Button>
      </div>
    </div>
  );
}
