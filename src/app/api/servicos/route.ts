import { NextResponse } from "next/server";
import { corpoJson, exigirPapel, rota } from "@/lib/api";
import { exigirSalao, exigirSalaoDoDono } from "@/services/saloes/saloes.service";
import { cadastrarServico, listarServicosDoSalao } from "@/services/servicos/servicos.service";

/**
 * RF20 — serviços do salão.
 *
 * GET  /api/servicos?salaoId=...  público (alimenta o perfil do salão e a escolha
 *                                 de serviço no agendamento)
 * GET  /api/servicos              sem salaoId: os serviços do salão do dono logado
 * POST /api/servicos              cadastra no salão do dono logado
 */

export const GET = rota(async (request: Request) => {
  const salaoId = new URL(request.url).searchParams.get("salaoId")?.trim();

  if (salaoId) {
    await exigirSalao(salaoId);
    return NextResponse.json({ servicos: await listarServicosDoSalao(salaoId) });
  }

  const dono = await exigirPapel("DONO_SALAO");
  const salao = await exigirSalaoDoDono(dono.id);

  return NextResponse.json({ salaoId: salao.id, servicos: await listarServicosDoSalao(salao.id) });
});

export const POST = rota(async (request: Request) => {
  const dono = await exigirPapel("DONO_SALAO");
  const salao = await exigirSalaoDoDono(dono.id);

  const servico = await cadastrarServico(salao.id, await corpoJson(request));

  return NextResponse.json({ servico }, { status: 201 });
});
