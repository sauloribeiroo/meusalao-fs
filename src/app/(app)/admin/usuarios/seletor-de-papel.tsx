"use client";

import { useActionState } from "react";
import { alterarPapelAction, type EstadoAdmin } from "@/acoes/admin";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";
import { PAPEIS } from "@/services/admin/schemas";

const INICIAL: EstadoAdmin = {};

const ROTULO: Record<string, string> = {
  CLIENTE: "Cliente",
  DONO_SALAO: "Dono de salão",
  ADMIN: "Administrador",
};

/**
 * RF26 — troca o papel de um usuário.
 *
 * Um `select` que só envia ao clicar em "Aplicar", em vez de ao mudar: a ação
 * pode rebaixar um dono e tirar o salão dele do ar, então vale exigir o
 * segundo gesto.
 */
export function SeletorDePapel({ usuarioId, papel }: { usuarioId: string; papel: string }) {
  const [estado, acao, executando] = useActionState(alterarPapelAction, INICIAL);

  return (
    <div className="space-y-2">
      <form action={acao} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="usuarioId" value={usuarioId} />

        <label className="sr-only" htmlFor={`papel-${usuarioId}`}>
          Papel do usuário
        </label>
        <select
          id={`papel-${usuarioId}`}
          name="papel"
          defaultValue={papel}
          className="h-9 rounded-lg border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {PAPEIS.map((valor) => (
            <option key={valor} value={valor}>
              {ROTULO[valor]}
            </option>
          ))}
        </select>

        <Button type="submit" size="sm" variant="outline" disabled={executando}>
          {executando ? "Salvando..." : "Aplicar"}
        </Button>
      </form>

      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}
    </div>
  );
}
