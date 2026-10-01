import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, CheckCircle2, Clock, MapPin, Scissors } from "lucide-react";
import { auth } from "@/auth";
import { buscarAgendamentoDoCliente } from "@/services/agendamentos/agendamentos.service";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Agendamento confirmado | MeuSalão" };

const formatoPreco = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function SucessoPage({
  params,
  searchParams,
}: {
  params: Promise<{ salaoId: string }>;
  searchParams: Promise<{ agendamentoId?: string }>;
}) {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const { salaoId } = await params;
  const { agendamentoId } = await searchParams;
  if (!agendamentoId) notFound();

  const agendamento = await buscarAgendamentoDoCliente(agendamentoId, sessao.user.id);
  if (!agendamento || agendamento.salaoId !== salaoId) notFound();

  return (
    <main className="mx-auto max-w-xl px-6 py-10 text-center">
      <CheckCircle2 className="mx-auto size-14 text-primary" aria-hidden />
      <h1 className="mt-4 text-2xl font-black tracking-tight">Agendamento confirmado!</h1>
      <p className="mt-1 text-sm text-muted-foreground">Você vai receber os detalhes também por e-mail.</p>

      <Card className="mt-6 text-left">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p className="font-medium">{agendamento.salao.nome}</p>
          </div>
          <div className="flex items-start gap-3">
            <Scissors className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p className="font-medium">
              {agendamento.servico.nome}
              {agendamento.servico.preco && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {formatoPreco.format(Number(agendamento.servico.preco))}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p className="font-medium capitalize">
              {format(agendamento.dataHora, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p className="font-medium">{format(agendamento.dataHora, "HH:mm")}</p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-center gap-3">
        <Link href="/inicio" className={buttonVariants({ variant: "outline" })}>
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
