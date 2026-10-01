import { NextResponse } from "next/server";
import { corpoJson, exigirPapel, rota } from "@/lib/api";
import { exigirSalaoDoDono } from "@/services/saloes/saloes.service";
import { editarServico, removerServico } from "@/services/servicos/servicos.service";

/**
 * RF20 — edição e remoção de um serviço. Sempre no salão do dono logado: não há
 * como alterar serviço de outro salão passando um id de fora (RGN07).
 */

type Contexto = { params: Promise<{ id: string }> };

export const PATCH = rota(async (request: Request, { params }: Contexto) => {
  const dono = await exigirPapel("DONO_SALAO");
  const salao = await exigirSalaoDoDono(dono.id);
  const { id } = await params;

  const servico = await editarServico(salao.id, id, await corpoJson(request));

  return NextResponse.json({ servico });
});

export const DELETE = rota(async (_request: Request, { params }: Contexto) => {
  const dono = await exigirPapel("DONO_SALAO");
  const salao = await exigirSalaoDoDono(dono.id);
  const { id } = await params;

  await removerServico(salao.id, id);

  return new NextResponse(null, { status: 204 });
});
