import { NextResponse } from "next/server";
import { corpoJson, exigirPapel, rota } from "@/lib/api";
import { alterarPapel, listarUsuarios } from "@/services/admin/admin.service";

/**
 * RF26 — usuários da plataforma.
 *
 * GET   /api/admin/usuarios?termo=&papel=
 * PATCH /api/admin/usuarios  { "usuarioId": "...", "papel": "DONO_SALAO" }
 */

export const GET = rota(async (request: Request) => {
  await exigirPapel("ADMIN");

  const busca = new URL(request.url).searchParams;
  const usuarios = await listarUsuarios({
    termo: busca.get("termo") ?? undefined,
    papel: busca.get("papel") ?? undefined,
  });

  return NextResponse.json({ usuarios });
});

export const PATCH = rota(async (request: Request) => {
  const administrador = await exigirPapel("ADMIN");
  const usuario = await alterarPapel(administrador.id, await corpoJson(request));

  return NextResponse.json({ usuario });
});
