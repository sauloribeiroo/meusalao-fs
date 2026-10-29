"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as MapaLeaflet, Marker } from "leaflet";
import type { SalaoNaLista } from "@/services/saloes/saloes.service";

/**
 * RF11 — salões no mapa.
 *
 * Leaflet puro, carregado sob demanda, em vez de react-leaflet: a biblioteca
 * toca o DOM diretamente e precisa de `window`, então só pode rodar depois da
 * montagem. O import dinâmico evita que ela entre no pacote do servidor.
 *
 * O ladrilho vem do OpenStreetMap, que não exige chave de API — nada de
 * credencial de mapa no repositório nem cobrança por acesso.
 */

/** Fortaleza, usada quando não há localização nem salão com coordenadas. */
const CENTRO_PADRAO: [number, number] = [-3.7319, -38.5267];

/** Marcador desenhado em HTML: evita o problema clássico de assets do Leaflet. */
const marcador = (cor: string, rotulo: string) => `
  <span style="
    display:flex;align-items:center;justify-content:center;
    width:28px;height:28px;border-radius:9999px;
    background:${cor};color:#fff;font-size:13px;font-weight:700;
    border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${rotulo}</span>`;

export function MapaSaloes({
  saloes,
  origem,
}: {
  saloes: SalaoNaLista[];
  origem: { latitude: number; longitude: number } | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const marcadores = useRef<Marker[]>([]);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const L = await import("leaflet");
      if (cancelado || !container.current) return;

      if (!mapa.current) {
        mapa.current = L.map(container.current, { scrollWheelZoom: false }).setView(CENTRO_PADRAO, 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapa.current);
      }

      for (const antigo of marcadores.current) antigo.remove();
      marcadores.current = [];

      const pontos: [number, number][] = [];

      saloes.forEach((salao, indice) => {
        if (salao.latitude === null || salao.longitude === null) return;

        const ponto: [number, number] = [salao.latitude, salao.longitude];
        pontos.push(ponto);

        const distancia =
          salao.distanciaKm === null
            ? ""
            : `<br><span style="color:#6b21a8">${
                salao.distanciaKm < 1
                  ? `${Math.round(salao.distanciaKm * 1000)} m`
                  : `${salao.distanciaKm.toFixed(1).replace(".", ",")} km`
              } de você</span>`;

        const preco =
          salao.precoMinimo === null
            ? "Consultar preço"
            : `A partir de R$ ${salao.precoMinimo.toFixed(2).replace(".", ",")}`;

        const marca = L.marker(ponto, {
          title: salao.nome,
          icon: L.divIcon({
            html: marcador("#7c3aed", String(indice + 1)),
            className: "",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        })
          .addTo(mapa.current!)
          .bindPopup(
            `<strong>${salao.nome}</strong>${distancia}<br>${preco}<br>
             <a href="/salao/${salao.id}" style="color:#7c3aed;font-weight:600">Ver salão →</a>`,
          );

        marcadores.current.push(marca);
      });

      if (origem) {
        const aqui = L.marker([origem.latitude, origem.longitude], {
          title: "Você está aqui",
          icon: L.divIcon({
            html: marcador("#059669", "•"),
            className: "",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        })
          .addTo(mapa.current)
          .bindPopup("Você está aqui");

        marcadores.current.push(aqui);
        pontos.push([origem.latitude, origem.longitude]);
      }

      if (pontos.length === 1) mapa.current.setView(pontos[0], 15);
      else if (pontos.length > 1) mapa.current.fitBounds(L.latLngBounds(pontos), { padding: [40, 40] });
    })();

    return () => {
      cancelado = true;
    };
  }, [saloes, origem]);

  // O mapa é destruído só ao desmontar: recriar a cada mudança de dados
  // perderia o zoom e a posição que o usuário escolheu.
  useEffect(
    () => () => {
      mapa.current?.remove();
      mapa.current = null;
    },
    [],
  );

  return (
    <div
      ref={container}
      role="application"
      aria-label="Mapa com os salões disponíveis"
      // No celular a altura é fixa, e o mapa sai em retrato — cabe na tela sem
      // rolagem, o que importa porque arrastar o dedo sobre o mapa move o mapa,
      // não a página. Em tela larga esses mesmos 26rem viravam uma faixa de
      // quase 3:1, com meio quarteirão na vertical; daí a altura proporcional à
      // janela a partir de sm, com teto para não passar da tela em monitor alto.
      className="h-[26rem] w-full overflow-hidden rounded-xl border border-border sm:h-[70vh] sm:max-h-[40rem] sm:min-h-[26rem]"
    />
  );
}
