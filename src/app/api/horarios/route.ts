import { NextResponse } from "next/server";
import { corpoJson, exigirPapel, rota } from "@/lib/api";
import { definirHorariosDoSalao, listarHorariosDoSalao } from "@/services/horarios/horarios.service";
import { exigirSalao, exigirSalaoDoDono } from "@/services/saloes/saloes.service";

/**
 * RF22 — horários de funcionamento.
 *
 * GET /api/horarios?salaoId=...  público (perfil do salão)
 * GET /api/horarios              sem salaoId: a semana do salão do dono logado
 * PUT /api/horarios              substitui a semana inteira do salão do dono
 *
 * É PUT, e não POST, porque o corpo descreve a semana completa: o que não vier
 * na lista deixa de existir. Replicar para os dias úteis é a tela que resolve,
 * montando as cinco entradas iguais antes de enviar.
 */

export const GET = rota(async (request: Request) => {
  const salaoId = new URL(request.url).searchParams.get("salaoId")?.trim();

  if (salaoId) {
    await exigirSalao(salaoId);
    return NextResponse.json({ horarios: await listarHorariosDoSalao(salaoId) });
  }

  const dono = await exigirPapel("DONO_SALAO");
  const salao = await exigirSalaoDoDono(dono.id);

  return NextResponse.json({ salaoId: salao.id, horarios: await listarHorariosDoSalao(salao.id) });
});

export const PUT = rota(async (request: Request) => {
  const dono = await exigirPapel("DONO_SALAO");
  const salao = await exigirSalaoDoDono(dono.id);

  const horarios = await definirHorariosDoSalao(salao.id, await corpoJson(request));

  return NextResponse.json({ salaoId: salao.id, horarios });
});
