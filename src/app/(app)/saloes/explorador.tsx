"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { List, Loader2, MapPin, MapPinned, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { precoEmReais } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { distanciaLegivel } from "@/services/saloes/distancia";
import type { SalaoNaLista } from "@/services/saloes/saloes.service";

// O Leaflet precisa de `window`, então o componente não pode ser renderizado
// no servidor.
const MapaSaloes = dynamic(() => import("@/components/mapa-saloes").then((m) => m.MapaSaloes), {
  ssr: false,
  loading: () => (
    <div className="flex h-[26rem] items-center justify-center rounded-xl border border-border bg-muted">
      <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
    </div>
  ),
});

type Origem = { latitude: number; longitude: number };
type Localizacao = "inicial" | "pedindo" | "concedida" | "negada" | "indisponivel";

/** RF11 — lista e mapa dos salões, com ordenação por proximidade. */
export function ExploradorDeSaloes({ iniciais }: { iniciais: SalaoNaLista[] }) {
  const [saloes, setSaloes] = useState(iniciais);
  const [origem, setOrigem] = useState<Origem | null>(null);
  const [localizacao, setLocalizacao] = useState<Localizacao>("inicial");
  const [visao, setVisao] = useState<"lista" | "mapa">("lista");

  const comCoordenadas = saloes.filter((salao) => salao.latitude !== null && salao.longitude !== null);

  const buscarComOrigem = useCallback(async (ponto: Origem) => {
    const busca = new URLSearchParams({ lat: String(ponto.latitude), lng: String(ponto.longitude) });
    const resposta = await fetch(`/api/saloes?${busca}`);
    if (!resposta.ok) return;

    const corpo = await resposta.json();
    setSaloes(corpo.saloes);
  }, []);

  const pedirLocalizacao = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocalizacao("indisponivel");
      return;
    }

    setLocalizacao("pedindo");
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        const ponto = { latitude: posicao.coords.latitude, longitude: posicao.coords.longitude };
        setOrigem(ponto);
        setLocalizacao("concedida");
        void buscarComOrigem(ponto);
      },
      // RNF08: sem permissão, a lista continua — só perde a ordenação por perto.
      () => setLocalizacao("negada"),
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, [buscarComOrigem]);

  // Pede a localização assim que a tela abre; negar não quebra nada.
  useEffect(() => {
    pedirLocalizacao();
  }, [pedirLocalizacao]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-border p-0.5" role="group" aria-label="Forma de visualização">
          {(["lista", "mapa"] as const).map((modo) => (
            <button
              key={modo}
              type="button"
              onClick={() => setVisao(modo)}
              aria-pressed={visao === modo}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                visao === modo ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {modo === "lista" ? <List className="size-4" aria-hidden /> : <MapPinned className="size-4" aria-hidden />}
              {modo === "lista" ? "Lista" : "Mapa"}
            </button>
          ))}
        </div>

        <StatusDaLocalizacao estado={localizacao} aoTentarDeNovo={pedirLocalizacao} />
      </div>

      {visao === "mapa" ? (
        comCoordenadas.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              Nenhum salão com localização cadastrada ainda.
            </CardContent>
          </Card>
        ) : (
          <MapaSaloes saloes={comCoordenadas} origem={origem} />
        )
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {saloes.map((salao) => (
            <li key={salao.id}>
              <Link href={`/salao/${salao.id}/agendar`} className="block h-full">
                <Card className="h-full transition-colors hover:border-primary">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{salao.nome}</p>
                      {salao.distanciaKm !== null && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {distanciaLegivel(salao.distanciaKm)}
                        </span>
                      )}
                    </div>
                    {salao.tipo && <p className="mt-0.5 text-xs text-primary">{salao.tipo}</p>}
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      {salao.endereco}
                    </p>
                    <p className="mt-3 text-sm">
                      <span className="text-muted-foreground">A partir de </span>
                      <span className="font-semibold">{precoEmReais(salao.precoMinimo)}</span>
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {saloes.length === 0 && visao === "lista" && (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Nenhum salão publicado ainda.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusDaLocalizacao({
  estado,
  aoTentarDeNovo,
}: {
  estado: Localizacao;
  aoTentarDeNovo: () => void;
}) {
  if (estado === "pedindo") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Procurando sua localização...
      </p>
    );
  }

  if (estado === "concedida") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-emerald-700">
        <Navigation className="size-3.5" aria-hidden />
        Ordenado por proximidade
      </p>
    );
  }

  if (estado === "negada" || estado === "indisponivel") {
    return (
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">
          {estado === "negada" ? "Sem acesso à sua localização." : "Localização indisponível neste navegador."}
        </p>
        {estado === "negada" && (
          <Button type="button" variant="outline" size="sm" onClick={aoTentarDeNovo}>
            Permitir
          </Button>
        )}
      </div>
    );
  }

  return <span />;
}
