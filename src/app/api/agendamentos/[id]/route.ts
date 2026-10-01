import { NextResponse } from "next/server";
import { corpoJson, exigirPapel, exigirSessao, rota } from "@/lib/api";
import {
  aplicarAcaoDoSalao,
  buscarAgendamentoVisivelPara,
} from "@/services/agendamentos/agendamentos.service";
import { exigirSalaoDoDono } from "@/services/saloes/saloes.service";

/**
 * RF25 — detalhe e gestão de um agendamento.
 *
 * GET   /api/agendamentos/[id]   visível ao cliente dono do agendamento e ao
 *                                dono do salão (admin inclusive)
 * PATCH /api/agendamentos/[id]   { "acao": "confirmar" | "recusar" | "concluir" }
 *                                só o dono do salão ou o administrador (RGN07)
 *
 * O cancelamento pelo cliente é a issue #24 e ainda não está aqui.
 */

type Contexto = { params: Promise<{ id: string }> };

export const GET = rota(async (_request: Request, { params }: Contexto) => {
  const usuario = await exigirSessao();
  const { id } = await params;

  return NextResponse.json({ agendamento: await buscarAgendamentoVisivelPara(usuario, id) });
});

export const PATCH = rota(async (request: Request, { params }: Contexto) => {
  const dono = await exigirPapel("DONO_SALAO");
  const salao = await exigirSalaoDoDono(dono.id);
  const { id } = await params;

  const agendamento = await aplicarAcaoDoSalao(salao.id, id, await corpoJson(request));

  return NextResponse.json({ agendamento });
});
