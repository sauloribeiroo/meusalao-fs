import { NextResponse } from "next/server";
import { rota } from "@/lib/api";
import { ErroDeValidacao } from "@/services/erros";
import { listarSaloesPublicados, ORDENACOES, type Ordenacao } from "@/services/saloes/saloes.service";
import type { Coordenada } from "@/services/saloes/distancia";

/**
 * RF11, RF09 e RF10 — salões publicados, com busca, filtros e distância.
 *
 * GET /api/saloes                    ordenado por nome
 * GET /api/saloes?lat=&lng=          ordenado por proximidade, com `distanciaKm`
 * GET /api/saloes?termo=corte        nome do salão ou de um serviço dele
 * GET /api/saloes?tipo=Barbearia
 * GET /api/saloes?precoMax=80&notaMin=4&distanciaMax=5
 * GET /api/saloes?ordenar=proximidade|nome|preco|nota
 *
 * Rota pública: devolve só o que já é público no perfil do salão.
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

/**
 * Número positivo vindo da query. Valor ausente vira `undefined` (filtro não
 * aplicado); valor presente mas inválido é erro, e não silêncio — senão um
 * `precoMax=abc` devolveria a lista inteira como se nada tivesse sido pedido.
 */
function numeroDaQuery(parametros: URLSearchParams, nome: string, maximo: number): number | undefined {
  const bruto = parametros.get(nome);
  if (bruto === null || bruto.trim() === "") return undefined;

  const numero = Number(bruto.replace(",", "."));
  if (!Number.isFinite(numero) || numero < 0 || numero > maximo) {
    throw new ErroDeValidacao({ [nome]: [`Valor inválido para "${nome}"`] });
  }

  return numero;
}

export const GET = rota(async (request: Request) => {
  const origem = origemDaQuery(request);
  const parametros = new URL(request.url).searchParams;

  const ordenar = parametros.get("ordenar") ?? undefined;
  if (ordenar !== undefined && !ORDENACOES.some((valor) => valor === ordenar)) {
    throw new ErroDeValidacao({ ordenar: [`Ordenação inválida (use: ${ORDENACOES.join(", ")})`] });
  }

  const saloes = await listarSaloesPublicados(origem, {
    termo: parametros.get("termo") ?? undefined,
    tipo: parametros.get("tipo") ?? undefined,
    precoMaximo: numeroDaQuery(parametros, "precoMax", 99999.99),
    notaMinima: numeroDaQuery(parametros, "notaMin", 5),
    distanciaMaximaKm: numeroDaQuery(parametros, "distanciaMax", 20000),
    ordenacao: ordenar as Ordenacao | undefined,
  });

  return NextResponse.json({ comLocalizacao: origem !== null, saloes });
});
