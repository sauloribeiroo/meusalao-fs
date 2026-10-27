import { NextResponse } from "next/server";
import { corpoJson, exigirPapel, rota } from "@/lib/api";
import { listarAvaliacoesParaModeracao, removerComentario } from "@/services/admin/admin.service";
import { ErroDeValidacao } from "@/services/erros";

/**
 * RF26 — moderação de avaliações.
 *
 * GET    /api/admin/avaliacoes
 * DELETE /api/admin/avaliacoes  { "avaliacaoId": "..." }  remove só o comentário
 */

export const GET = rota(async () => {
  await exigirPapel("ADMIN");

  return NextResponse.json({ avaliacoes: await listarAvaliacoesParaModeracao() });
});

export const DELETE = rota(async (request: Request) => {
  await exigirPapel("ADMIN");

  const corpo = (await corpoJson(request)) as { avaliacaoId?: unknown };
  if (typeof corpo?.avaliacaoId !== "string" || corpo.avaliacaoId.trim() === "") {
    throw new ErroDeValidacao({ avaliacaoId: ["Informe a avaliação"] });
  }

  await removerComentario(corpo.avaliacaoId);

  return NextResponse.json({ removido: true });
});
