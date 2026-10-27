"use client";

import { useActionState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { moderarSalaoAction, type EstadoAdmin } from "@/acoes/admin";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";

const INICIAL: EstadoAdmin = {};

/** RF26 — tira um salão do ar, ou devolve. */
export function BotaoModerar({ salaoId, publicado }: { salaoId: string; publicado: boolean }) {
  const [estado, acao, executando] = useActionState(moderarSalaoAction, INICIAL);

  return (
    <div className="space-y-2">
      <form action={acao}>
        <input type="hidden" name="salaoId" value={salaoId} />
        <input type="hidden" name="publicado" value={publicado ? "false" : "true"} />
        <Button
          type="submit"
          size="sm"
          variant={publicado ? "destructive" : "outline"}
          disabled={executando}
        >
          {publicado ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          {executando ? "Salvando..." : publicado ? "Tirar do ar" : "Republicar"}
        </Button>
      </form>

      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}
    </div>
  );
}
