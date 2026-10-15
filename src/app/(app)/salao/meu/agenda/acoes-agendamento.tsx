"use client";

import { useActionState } from "react";
import { Check, CheckCheck, X } from "lucide-react";
import { aplicarAcaoAction, type EstadoAgenda } from "@/acoes/agenda";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";

const INICIAL: EstadoAgenda = {};

/** Transições oferecidas em cada status (as mesmas que o serviço aceita). */
const ACOES: Record<string, { acao: string; rotulo: string; Icone: typeof Check; variante?: "outline" }[]> = {
  PENDENTE: [
    { acao: "confirmar", rotulo: "Confirmar", Icone: Check },
    { acao: "recusar", rotulo: "Recusar", Icone: X, variante: "outline" },
  ],
  CONFIRMADO: [
    { acao: "concluir", rotulo: "Marcar como concluído", Icone: CheckCheck },
    { acao: "recusar", rotulo: "Cancelar", Icone: X, variante: "outline" },
  ],
  CANCELADO: [],
  CONCLUIDO: [],
};

/** RF25 — botões de ação de um agendamento. */
export function AcoesDoAgendamento({ agendamentoId, status }: { agendamentoId: string; status: string }) {
  const [estado, acao, executando] = useActionState(aplicarAcaoAction, INICIAL);
  const disponiveis = ACOES[status] ?? [];

  if (disponiveis.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {status === "CONCLUIDO" ? "Atendimento concluído." : "Este agendamento foi cancelado."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

      <div className="flex flex-wrap gap-2">
        {disponiveis.map(({ acao: nome, rotulo, Icone, variante }) => (
          <form key={nome} action={acao}>
            <input type="hidden" name="agendamentoId" value={agendamentoId} />
            <input type="hidden" name="acao" value={nome} />
            <Button type="submit" size="sm" variant={variante} disabled={executando}>
              <Icone aria-hidden />
              {rotulo}
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
