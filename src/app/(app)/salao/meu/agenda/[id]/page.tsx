import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Phone, Scissors, User } from "lucide-react";
import { auth } from "@/auth";
import { AcoesDoAgendamento } from "@/app/(app)/salao/meu/agenda/acoes-agendamento";
import { SemSalao } from "@/components/sem-salao";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { dataPorExtenso, duracaoLegivel, precoEmReais, statusLegivel } from "@/lib/formato";
import { buscarAgendamentoDoSalao } from "@/services/agendamentos/agendamentos.service";
import { ErroDeNegocio } from "@/services/erros";
import { salaoDoDono } from "@/services/saloes/saloes.service";

export const metadata: Metadata = { title: "Detalhe do agendamento | MeuSalão" };

/** RF25 — detalhe de um agendamento recebido. */
export default async function DetalheDoAgendamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sessao = await auth();
  const salao = await salaoDoDono(sessao!.user.id);
  if (!salao) return <SemSalao />;

  const { id } = await params;

  // O serviço já restringe ao salão do dono: id de outro salão responde como
  // inexistente, em vez de confirmar que o agendamento existe.
  const agendamento = await buscar(salao.id, id);
  if (!agendamento) notFound();

  const status = statusLegivel(agendamento.status);

  return (
    <div className="space-y-6">
      <Link href="/salao/meu/agenda" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeft aria-hidden />
        Voltar para a agenda
      </Link>

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">Detalhe do agendamento</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Pedido feito em {new Date(agendamento.criadoEm).toLocaleString("pt-BR")}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.classe}`}>
              {status.rotulo}
            </span>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <Item Icone={User} rotulo="Cliente">
              {agendamento.cliente.nome}
            </Item>
            <Item Icone={Phone} rotulo="Telefone">
              {agendamento.cliente.telefone ?? "Não informado"}
            </Item>
            <Item Icone={Scissors} rotulo="Serviço">
              {agendamento.servico.nome}
              <span className="block text-sm font-normal text-muted-foreground">
                {precoEmReais(agendamento.servico.preco)} · {duracaoLegivel(agendamento.duracaoMin)}
              </span>
            </Item>
            <Item Icone={CalendarDays} rotulo="Dia">
              <span className="block first-letter:uppercase">{dataPorExtenso(agendamento.data)}</span>
            </Item>
            <Item Icone={Clock} rotulo="Horário">
              {agendamento.hora}
              <span className="block text-sm font-normal text-muted-foreground">
                Até {fimPrevisto(agendamento.hora, agendamento.duracaoMin)}
              </span>
            </Item>
          </dl>

          <div className="border-t border-border pt-5">
            <AcoesDoAgendamento agendamentoId={agendamento.id} status={agendamento.status} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Item({
  Icone,
  rotulo,
  children,
}: {
  Icone: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</dt>
        <dd className="font-medium">{children}</dd>
      </div>
    </div>
  );
}

/** "10:00" + 90 min → "11:30". */
function fimPrevisto(hora: string, duracaoMin: number): string {
  const [h, m] = hora.split(":").map(Number);
  const total = h * 60 + m + duracaoMin;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

async function buscar(salaoId: string, agendamentoId: string) {
  try {
    return await buscarAgendamentoDoSalao(salaoId, agendamentoId);
  } catch (erro) {
    if (erro instanceof ErroDeNegocio) return null;
    throw erro;
  }
}
