"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Star } from "lucide-react";
import { avaliarAction, type EstadoDoCliente } from "@/acoes/meus-agendamentos";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { COMENTARIO_MAXIMO, NOTA_MAXIMA } from "@/services/avaliacoes/schemas";

const INICIAL: EstadoDoCliente = {};

const DESCRICAO_DA_NOTA = ["Péssimo", "Ruim", "Regular", "Bom", "Excelente"];

/** RF19 — nota de 1 a 5 e comentário opcional. */
export function FormularioAvaliacao({ agendamentoId }: { agendamentoId: string }) {
  const [estado, acao] = useActionState(avaliarAction, INICIAL);
  const [nota, setNota] = useState(0);

  return (
    <form action={acao} className="space-y-6" noValidate>
      <input type="hidden" name="agendamentoId" value={agendamentoId} />
      <input type="hidden" name="nota" value={nota || ""} />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Sua nota</legend>

        {/* radiogroup em vez de botões soltos: leitor de tela anuncia o valor
            escolhido e a navegação por teclado funciona sem código extra. */}
        <div role="radiogroup" aria-label="Nota de 1 a 5" className="flex gap-1">
          {Array.from({ length: NOTA_MAXIMA }, (_, indice) => indice + 1).map((valor) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={nota === valor}
              aria-label={`${valor} ${valor === 1 ? "estrela" : "estrelas"} — ${DESCRICAO_DA_NOTA[valor - 1]}`}
              onClick={() => setNota(valor)}
              className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star
                className={cn(
                  "size-8",
                  valor <= nota ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
                )}
                aria-hidden
              />
            </button>
          ))}
        </div>

        <p className="h-5 text-sm text-muted-foreground">
          {nota > 0 ? DESCRICAO_DA_NOTA[nota - 1] : "Toque nas estrelas para dar sua nota."}
        </p>

        {estado.erros?.nota?.[0] && <p className="text-xs text-destructive">{estado.erros.nota[0]}</p>}
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="comentario">Comentário (opcional)</Label>
        <textarea
          id="comentario"
          name="comentario"
          rows={4}
          maxLength={COMENTARIO_MAXIMO}
          placeholder="O que achou do atendimento?"
          aria-invalid={Boolean(estado.erros?.comentario)}
          className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {estado.erros?.comentario?.[0] && (
          <p className="text-xs text-destructive">{estado.erros.comentario[0]}</p>
        )}
      </div>

      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

      <BotaoEnviar desabilitado={nota === 0} />
    </form>
  );
}

function BotaoEnviar({ desabilitado }: { desabilitado: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending || desabilitado}>
      {pending ? "Enviando..." : "Enviar avaliação"}
    </Button>
  );
}
