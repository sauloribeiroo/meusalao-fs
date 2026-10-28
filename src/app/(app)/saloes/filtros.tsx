"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ORDENACOES, type FiltrosDeBusca, type Ordenacao } from "@/services/saloes/saloes.service";

const ROTULO_ORDENACAO: Record<Ordenacao, string> = {
  proximidade: "Mais perto",
  nome: "Nome (A–Z)",
  preco: "Menor preço",
  nota: "Melhor avaliados",
};

const SEM_FILTROS: FiltrosDeBusca = {};

/**
 * RF09 e RF10 — busca por nome e filtros avançados.
 *
 * Os avançados ficam recolhidos atrás de "Filtros": a busca por texto resolve a
 * maior parte dos casos, e quatro controles abertos de uma vez empurrariam a
 * lista para fora da tela no celular.
 */
export function Filtros({
  valores,
  aoAplicar,
  temLocalizacao,
  tipos,
  carregando,
}: {
  valores: FiltrosDeBusca;
  aoAplicar: (filtros: FiltrosDeBusca) => void;
  temLocalizacao: boolean;
  tipos: string[];
  carregando: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<FiltrosDeBusca>(valores);

  const ativos = contarAtivos(valores);

  function aplicar(parcial: Partial<FiltrosDeBusca>) {
    const novos = { ...rascunho, ...parcial };
    setRascunho(novos);
    aoAplicar(novos);
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          aoAplicar(rascunho);
        }}
        className="flex flex-wrap gap-2"
      >
        <div className="relative min-w-56 flex-1">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={rascunho.termo ?? ""}
            onChange={(evento) => setRascunho({ ...rascunho, termo: evento.target.value })}
            placeholder="Buscar salão ou serviço"
            aria-label="Buscar salão ou serviço"
            className="pl-9"
          />
        </div>

        <Button type="submit" disabled={carregando}>
          {carregando ? "Buscando..." : "Buscar"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setAberto((atual) => !atual)}
          aria-expanded={aberto}
        >
          <SlidersHorizontal aria-hidden />
          Filtros
          {ativos > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
              {ativos}
            </span>
          )}
        </Button>
      </form>

      {aberto && (
        <div className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="filtro-tipo">Tipo</Label>
            <select
              id="filtro-tipo"
              value={rascunho.tipo ?? ""}
              onChange={(evento) => aplicar({ tipo: evento.target.value || undefined })}
              className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos</option>
              {tipos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filtro-preco">Preço até (R$)</Label>
            <Input
              id="filtro-preco"
              type="number"
              min={0}
              step={10}
              value={rascunho.precoMaximo ?? ""}
              onChange={(evento) =>
                aplicar({ precoMaximo: evento.target.value ? Number(evento.target.value) : undefined })
              }
              placeholder="Sem limite"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filtro-nota">Nota mínima</Label>
            <select
              id="filtro-nota"
              value={rascunho.notaMinima ?? ""}
              onChange={(evento) =>
                aplicar({ notaMinima: evento.target.value ? Number(evento.target.value) : undefined })
              }
              className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Qualquer</option>
              {[3, 4, 4.5].map((nota) => (
                <option key={nota} value={nota}>
                  {nota.toString().replace(".", ",")} ou mais
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filtro-distancia">Distância até</Label>
            <select
              id="filtro-distancia"
              value={rascunho.distanciaMaximaKm ?? ""}
              disabled={!temLocalizacao}
              onChange={(evento) =>
                aplicar({
                  distanciaMaximaKm: evento.target.value ? Number(evento.target.value) : undefined,
                })
              }
              className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Qualquer</option>
              {[1, 3, 5, 10].map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
            </select>
            {!temLocalizacao && (
              <p className="text-xs text-muted-foreground">Precisa da sua localização.</p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
            <span className="text-sm font-medium">Ordenar por</span>
            <div className="flex flex-wrap gap-2">
              {ORDENACOES.map((valor) => {
                const indisponivel = valor === "proximidade" && !temLocalizacao;
                const ativo = (rascunho.ordenacao ?? "proximidade") === valor;

                return (
                  <button
                    key={valor}
                    type="button"
                    disabled={indisponivel}
                    aria-pressed={ativo}
                    onClick={() => aplicar({ ordenacao: valor })}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      ativo
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {ROTULO_ORDENACAO[valor]}
                  </button>
                );
              })}
            </div>
          </div>

          {ativos > 0 && (
            <div className="sm:col-span-2 lg:col-span-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRascunho(SEM_FILTROS);
                  aoAplicar(SEM_FILTROS);
                }}
              >
                <X aria-hidden />
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Quantos filtros estão realmente restringindo a lista — o termo não conta. */
function contarAtivos(filtros: FiltrosDeBusca): number {
  return [filtros.tipo, filtros.precoMaximo, filtros.notaMinima, filtros.distanciaMaximaKm].filter(
    (valor) => valor !== undefined && valor !== "",
  ).length;
}
