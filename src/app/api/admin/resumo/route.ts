import { NextResponse } from "next/server";
import { exigirPapel, rota } from "@/lib/api";
import { resumoDaPlataforma } from "@/services/admin/admin.service";

/** RF26 — números gerais da plataforma. GET /api/admin/resumo */
export const GET = rota(async () => {
  await exigirPapel("ADMIN");

  return NextResponse.json({ resumo: await resumoDaPlataforma() });
});
