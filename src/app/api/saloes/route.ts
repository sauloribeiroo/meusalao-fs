import { NextResponse } from "next/server";
import { rota } from "@/lib/api";
import { ErroDeValidacao } from "@/services/erros";
import { listarSaloesPublicados } from "@/services/saloes/saloes.service";
import type { Coordenada } from "@/services/saloes/distancia";

/**
 * RF11 — salões publicados, com distância quando o cliente informa onde está.
 *
 * GET /api/saloes               ordenado por nome
 * GET /api/saloes?lat=&lng=     ordenado por proximidade, com `distanciaKm`
 *
 * Rota pública: devolve só o que já é público no perfil do salão. A busca por
 * nome e serviço e os filtros avançados são a issue #10.
 */

/** Lê lat/lng da query. Coordenada incompleta ou inválida é tratada como ausente. */
function origemDaQuery(request: Request): Coordenada | null {
  const parametros = new URL(request.url).searchParams;
  const lat = parametros.get("lat");
  const lng = parametros.get("lng");

  if (lat === null && lng === null) return null;
  if (lat === null || lng === null) {
    throw new ErroDeValidacao({ lat: ["Informe lat e lng juntos, ou nenhum dos dois"] });
  }

  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) {
    throw new ErroDeValidacao({ lat: ["Latitude inválida (entre -90 e 90)"] });
  }
  if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) {
    throw new ErroDeValidacao({ lng: ["Longitude inválida (entre -180 e 180)"] });
  }

  return { latitude, longitude };
}

export const GET = rota(async (request: Request) => {
  const origem = origemDaQuery(request);
  const saloes = await listarSaloesPublicados(origem);

  return NextResponse.json({ comLocalizacao: origem !== null, saloes });
});
