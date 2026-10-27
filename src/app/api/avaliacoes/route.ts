import { NextResponse } from "next/server";
import { corpoJson, exigirSessao, parametroObrigatorio, rota } from "@/lib/api";
import {
  criarAvaliacao,
  listarAvaliacoesDoSalao,
  resumoDeAvaliacoes,
} from "@/services/avaliacoes/avaliacoes.service";
import { exigirSalao } from "@/services/saloes/saloes.service";

/**
 * RF19 — avaliações de salão.
 *
 * GET  /api/avaliacoes?salaoId=...  público: lista e média do salão
 * POST /api/avaliacoes              cliente autenticado, atendimento concluído
 */

export const GET = rota(async (request: Request) => {
  const salaoId = parametroObrigatorio(request, "salaoId");
  await exigirSalao(salaoId);

  const [avaliacoes, resumo] = await Promise.all([
    listarAvaliacoesDoSalao(salaoId),
    resumoDeAvaliacoes(salaoId),
  ]);

  return NextResponse.json({ avaliacoes, resumo });
});

export const POST = rota(async (request: Request) => {
  const cliente = await exigirSessao();
  const avaliacao = await criarAvaliacao(cliente.id, await corpoJson(request));

  return NextResponse.json({ avaliacao }, { status: 201 });
});
