import { NextResponse } from "next/server";
import { StatusAgendamento } from "@prisma/client";
import { corpoJson, exigirSessao, rota } from "@/lib/api";
import {
  criarAgendamento,
  listarAgendamentosDoCliente,
  listarAgendamentosDoSalao,
} from "@/services/agendamentos/agendamentos.service";
import { ErroDeValidacao } from "@/services/erros";
import { salaoDoDono } from "@/services/saloes/saloes.service";

/**
 * RF16 e RF17 — criação e listagem de agendamentos.
 *
 * POST /api/agendamentos                    cria (cliente é o usuário da sessão)
 * GET  /api/agendamentos                    os agendamentos do cliente logado
 * GET  /api/agendamentos?visao=salao        a agenda do salão do dono logado
 *
 * Filtros do GET: `status` e, na visão de salão, `data` (AAAA-MM-DD).
 */

const STATUS_VALIDOS = Object.values(StatusAgendamento);

/** Lê e valida o filtro de status, que é opcional. */
function statusDaQuery(request: Request): StatusAgendamento | undefined {
  const valor = new URL(request.url).searchParams.get("status")?.trim().toUpperCase();
  if (!valor) return undefined;

  if (!STATUS_VALIDOS.includes(valor as StatusAgendamento)) {
    throw new ErroDeValidacao({ status: [`Status inválido (use: ${STATUS_VALIDOS.join(", ")})`] });
  }

  return valor as StatusAgendamento;
}

export const GET = rota(async (request: Request) => {
  const usuario = await exigirSessao();
  const parametros = new URL(request.url).searchParams;
  const status = statusDaQuery(request);

  if (parametros.get("visao") === "salao") {
    const salao = await salaoDoDono(usuario.id);
    // Dono sem salão ainda cadastrado vê uma agenda vazia, não um erro.
    if (!salao) return NextResponse.json({ visao: "salao", salaoId: null, agendamentos: [] });

    const data = parametros.get("data")?.trim() || undefined;
    const agendamentos = await listarAgendamentosDoSalao(salao.id, { status, data });

    return NextResponse.json({ visao: "salao", salaoId: salao.id, agendamentos });
  }

  const agendamentos = await listarAgendamentosDoCliente(usuario.id, { status });

  return NextResponse.json({ visao: "cliente", agendamentos });
});

export const POST = rota(async (request: Request) => {
  const usuario = await exigirSessao();

  const agendamento = await criarAgendamento(usuario.id, await corpoJson(request));

  return NextResponse.json({ agendamento }, { status: 201 });
});
