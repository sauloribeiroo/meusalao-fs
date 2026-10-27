import { NextResponse } from "next/server";
import { corpoJson, exigirPapel, exigirSessao, rota } from "@/lib/api";
import {
  aplicarAcaoDoSalao,
  buscarAgendamentoVisivelPara,
  cancelarAgendamentoDoCliente,
} from "@/services/agendamentos/agendamentos.service";
import { exigirSalaoDoDono } from "@/services/saloes/saloes.service";

/**
 * RF25 e RF18 — detalhe e gestão de um agendamento.
 *
 * GET    /api/agendamentos/[id]  visível ao cliente dono do agendamento e ao
 *                                dono do salão (admin inclusive)
 * PATCH  /api/agendamentos/[id]  { "acao": "confirmar" | "recusar" | "concluir" }
 *                                só o dono do salão ou o administrador (RGN07)
 * DELETE /api/agendamentos/[id]  cancelamento pelo cliente que agendou (RGN04)
 *
 * O cancelamento é DELETE, e não mais um verbo no PATCH, porque os dois têm
 * donos diferentes: o PATCH é do salão, o DELETE é do cliente. Separar deixa a
 * autorização explícita em cada handler, em vez de ramificar por papel dentro
 * de um só. O registro em si não é apagado — passa a CANCELADO.
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

export const DELETE = rota(async (_request: Request, { params }: Contexto) => {
  const cliente = await exigirSessao();
  const { id } = await params;

  return NextResponse.json({ agendamento: await cancelarAgendamentoDoCliente(cliente.id, id) });
});
