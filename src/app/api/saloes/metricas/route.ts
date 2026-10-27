import { NextResponse } from "next/server";
import { exigirPapel, rota } from "@/lib/api";
import { metricasDoSalao } from "@/services/saloes/metricas.service";
import { exigirSalaoDoDono } from "@/services/saloes/saloes.service";

/**
 * RF24 — métricas do salão do dono autenticado.
 *
 * GET /api/saloes/metricas
 */
export const GET = rota(async () => {
  const dono = await exigirPapel("DONO_SALAO");
  const salao = await exigirSalaoDoDono(dono.id);

  return NextResponse.json({ metricas: await metricasDoSalao(salao.id) });
});
