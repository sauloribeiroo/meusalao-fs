import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { gerarSlotsDisponiveis } from "@/services/agendamentos/disponibilidade.service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ salaoId: string }> }) {
  const sessao = await auth();
  if (!sessao?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const { salaoId } = await params;
  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data");
  const servicoId = searchParams.get("servicoId");

  if (!data || !servicoId) {
    return NextResponse.json({ erro: "Informe data e servicoId" }, { status: 400 });
  }

  const servico = await prisma.servico.findUnique({ where: { id: servicoId }, select: { salaoId: true, duracaoMin: true } });
  if (!servico || servico.salaoId !== salaoId) {
    return NextResponse.json({ erro: "Serviço inválido para este salão" }, { status: 400 });
  }

  const slots = await gerarSlotsDisponiveis(salaoId, new Date(`${data}T00:00:00`), servico.duracaoMin);
  return NextResponse.json({ slots });
}
