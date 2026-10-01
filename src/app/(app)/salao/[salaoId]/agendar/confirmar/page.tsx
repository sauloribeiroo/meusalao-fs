import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, MapPin, Scissors } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { BotaoConfirmar } from "@/app/(app)/salao/[salaoId]/agendar/confirmar/botao-confirmar";

export const metadata: Metadata = { title: "Confirmar agendamento | MeuSalão" };

const formatoPreco = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function ConfirmarPage({
  params,
  searchParams,
}: {
  params: Promise<{ salaoId: string }>;
  searchParams: Promise<{ servicoId?: string; dataHora?: string }>;
}) {
  const { salaoId } = await params;
  const { servicoId, dataHora } = await searchParams;

  if (!servicoId || !dataHora) notFound();

  const [salao, servico] = await Promise.all([
    prisma.salao.findUnique({ where: { id: salaoId } }),
    prisma.servico.findUnique({ where: { id: servicoId } }),
  ]);

  if (!salao || !servico || servico.salaoId !== salaoId) notFound();

  const dataAgendamento = new Date(dataHora);
  if (Number.isNaN(dataAgendamento.getTime())) notFound();

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-2xl font-black tracking-tight">Revise seu agendamento</h1>

      <Card className="mt-6">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="font-medium">{salao.nome}</p>
              <p className="text-sm text-muted-foreground">{salao.endereco}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Scissors className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="font-medium">{servico.nome}</p>
              <p className="text-sm text-muted-foreground">
                {servico.preco ? formatoPreco.format(Number(servico.preco)) : "Consultar preço"} · {servico.duracaoMin}{" "}
                min
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p className="font-medium capitalize">{format(dataAgendamento, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p className="font-medium">{format(dataAgendamento, "HH:mm")}</p>
          </div>
        </CardContent>
      </Card>

      <BotaoConfirmar salaoId={salaoId} servicoId={servicoId} dataHora={dataHora} />
    </main>
  );
}
