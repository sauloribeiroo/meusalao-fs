"use client";

import { useEffect, useState } from "react";
import { MapPin, MapPinned, X } from "lucide-react";
import type { SalonCardData } from "./salon-card";

export function MapModal({ saloes }: { saloes: SalonCardData[] }) {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!aberto) return;

    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAberto(false);
      }
    }

    window.addEventListener("keydown", aoPressionarTecla);
    return () => window.removeEventListener("keydown", aoPressionarTecla);
  }, [aberto]);

  const primeiroComCoordenadas = saloes.find(
    (s) => typeof s.latitude === "number" && typeof s.longitude === "number",
  );

  const urlMapaOsm = primeiroComCoordenadas
    ? (() => {
        const lat = primeiroComCoordenadas.latitude!;
        const lng = primeiroComCoordenadas.longitude!;
        const delta = 0.025;
        const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
        return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`;
      })()
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Ver salões disponíveis no mapa"
        className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/50 bg-card px-4 py-2 text-sm font-semibold text-primary shadow-xs transition-all duration-150 hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <MapPinned className="size-4" aria-hidden="true" />
        <span>Ver no mapa</span>
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 backdrop-blur-xs md:p-6"
          onClick={() => setAberto(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-modal-mapa"
        >
          <div
            className="flex h-dvh w-full flex-col overflow-hidden bg-card shadow-2xl md:h-[70vh] md:max-w-4xl md:rounded-2xl md:border md:border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <MapPinned className="size-5 text-primary" aria-hidden="true" />
                <h3 id="titulo-modal-mapa" className="text-base font-semibold text-foreground sm:text-lg">
                  Mapa de salões
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar mapa"
                className="flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative flex-1 bg-muted/40">
              {urlMapaOsm ? (
                <iframe
                  src={urlMapaOsm}
                  title="Mapa com localização dos salões disponíveis"
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              ) : (
                <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent p-6 text-center">
                  <div
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:40px_40px] text-primary/15"
                    aria-hidden="true"
                  />
                  <div className="relative z-10 flex flex-col items-center rounded-2xl border border-border bg-card/95 px-6 py-8 shadow-sm backdrop-blur-xs">
                    <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MapPin className="size-7" aria-hidden="true" />
                    </div>
                    <p className="text-base font-semibold text-foreground">
                      Mapa indisponível no momento
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
