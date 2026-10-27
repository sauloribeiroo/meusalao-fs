import { NextResponse } from "next/server";
import { corpoJson, exigirPapel, rota } from "@/lib/api";
import { listarSaloesParaAdmin, moderarSalao } from "@/services/admin/admin.service";

/**
 * RF26 — salões da plataforma, publicados ou não.
 *
 * GET   /api/admin/saloes?termo=
 * PATCH /api/admin/saloes  { "salaoId": "...", "publicado": false }
 */

export const GET = rota(async (request: Request) => {
  await exigirPapel("ADMIN");

  const termo = new URL(request.url).searchParams.get("termo")?.trim() || undefined;

  return NextResponse.json({ saloes: await listarSaloesParaAdmin(termo) });
});

export const PATCH = rota(async (request: Request) => {
  await exigirPapel("ADMIN");

  return NextResponse.json({ salao: await moderarSalao(await corpoJson(request)) });
});
