import { NextResponse } from "next/server";
import { parametroObrigatorio, rota } from "@/lib/api";
import { consultarDisponibilidade } from "@/services/agendamentos/disponibilidade.service";

/**
 * RF15 — horários livres de um salão em um dia, para um serviço.
 *
 * GET /api/disponibilidade?salaoId=...&servicoId=...&data=2026-10-05
 *
 * Rota pública: devolve a mesma informação que o perfil público do salão já
 * mostra (RF12) e não expõe dado de nenhum cliente — os horários ocupados saem
 * apenas como `livre: false`, sem dizer de quem são.
 */

export const GET = rota(async (request: Request) => {
  const disponibilidade = await consultarDisponibilidade({
    salaoId: parametroObrigatorio(request, "salaoId"),
    servicoId: parametroObrigatorio(request, "servicoId"),
    data: parametroObrigatorio(request, "data"),
  });

  return NextResponse.json(disponibilidade);
});
