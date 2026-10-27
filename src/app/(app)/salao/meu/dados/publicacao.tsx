"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Eye, EyeOff, X } from "lucide-react";
import { alternarPublicacaoAction, type EstadoPublicacao } from "@/acoes/publicacao";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SituacaoDePublicacao } from "@/services/saloes/saloes.service";

const INICIAL: EstadoPublicacao = {};

/** Onde o dono resolve cada requisito pendente. */
const ONDE_RESOLVER: Record<string, string> = {
  dados: "/salao/meu/dados",
  servicos: "/salao/meu/servicos",
  horarios: "/salao/meu/horarios",
  localizacao: "/salao/meu/dados",
};

/**
 * RF23 — publicação do perfil.
 *
 * O checklist aparece sempre, publicado ou não: depois de publicar, ele vira a
 * explicação do que ainda dá para melhorar (a localização, por exemplo, não
 * impede a publicação mas tira o salão do mapa).
 */
export function Publicacao({ situacao }: { situacao: SituacaoDePublicacao }) {
  const [estado, acao, executando] = useActionState(alternarPublicacaoAction, INICIAL);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
            situacao.publicado ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
          )}
        >
          {situacao.publicado ? <Eye className="size-3.5" aria-hidden /> : <EyeOff className="size-3.5" aria-hidden />}
          {situacao.publicado ? "Publicado" : "Fora do ar"}
        </span>

        <p className="text-sm text-muted-foreground">
          {situacao.publicado
            ? "Seu salão aparece na busca e no mapa."
            : "Só você enxerga este salão. Publique para receber agendamentos."}
        </p>
      </div>

      <ul className="space-y-2">
        {situacao.requisitos.map((requisito) => (
          <li key={requisito.chave} className="flex items-start gap-2.5 text-sm">
            {requisito.cumprido ? (
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
            ) : requisito.obrigatorio ? (
              <X className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
            ) : (
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            )}

            <span className={cn("min-w-0", requisito.cumprido && "text-muted-foreground")}>
              {requisito.rotulo}
              {!requisito.obrigatorio && !requisito.cumprido && " (opcional)"}
              {!requisito.cumprido && (
                <Link
                  href={ONDE_RESOLVER[requisito.chave] ?? "/salao/meu/dados"}
                  className="ml-1.5 font-semibold text-primary hover:underline"
                >
                  {requisito.comoResolver}
                </Link>
              )}
            </span>
          </li>
        ))}
      </ul>

      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

      <form action={acao}>
        <input type="hidden" name="publicado" value={situacao.publicado ? "false" : "true"} />
        <Button
          type="submit"
          variant={situacao.publicado ? "outline" : "default"}
          disabled={executando || (!situacao.publicado && !situacao.podePublicar)}
        >
          {situacao.publicado ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          {executando ? "Salvando..." : situacao.publicado ? "Tirar do ar" : "Publicar salão"}
        </Button>
      </form>
    </div>
  );
}
