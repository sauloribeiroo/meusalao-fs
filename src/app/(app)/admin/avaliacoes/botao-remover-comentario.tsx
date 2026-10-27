"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { removerComentarioAction, type EstadoAdmin } from "@/acoes/admin";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";

const INICIAL: EstadoAdmin = {};

/**
 * RF26 — remove o comentário de uma avaliação, preservando a nota.
 *
 * Confirmação em dois passos: a remoção não se desfaz, e o texto original não
 * fica guardado em lugar nenhum depois de apagado.
 */
export function BotaoRemoverComentario({ avaliacaoId }: { avaliacaoId: string }) {
  const [estado, acao, executando] = useActionState(removerComentarioAction, INICIAL);
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div className="space-y-2">
      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

      {confirmando ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">Remover este comentário?</span>
          <form action={acao}>
            <input type="hidden" name="avaliacaoId" value={avaliacaoId} />
            <Button type="submit" size="sm" variant="destructive" disabled={executando}>
              {executando ? "Removendo..." : "Sim, remover"}
            </Button>
          </form>
          <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmando(false)}>
            Manter
          </Button>
        </div>
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={() => setConfirmando(true)}>
          <Trash2 aria-hidden />
          Remover comentário
        </Button>
      )}
    </div>
  );
}
