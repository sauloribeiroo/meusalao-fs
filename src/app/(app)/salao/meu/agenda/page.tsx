import type { Metadata } from "next";
import Link from "next/link";
import { StatusAgendamento } from "@prisma/client";
import { CalendarDays, ChevronRight, Clock, User } from "lucide-react";
import { auth } from "@/auth";
import { AcoesDoAgendamento } from "@/app/(app)/salao/meu/agenda/acoes-agendamento";
import { SemSalao } from "@/components/sem-salao";
import { Card, CardContent } from "@/components/ui/card";
import { dataPorExtenso, duracaoLegivel, precoEmReais, statusLegivel } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { listarAgendamentosDoSalao } from "@/services/agendamentos/agendamentos.service";
import { salaoDoDono } from "@/services/saloes/saloes.service";

export const metadata: Metadata = { title: "Agenda | MeuSalão" };

/** Abas de status. "Pendentes" vem primeiro: é o que exige ação do salão. */
const FILTROS = [
  { chave: "PENDENTE", rotulo: "Pendentes" },
  { chave: "CONFIRMADO", rotulo: "Confirmados" },
  { chave: "CONCLUIDO", rotulo: "Concluídos" },
  { chave: "CANCELADO", rotulo: "Cancelados" },
  { chave: "TODOS", rotulo: "Todos" },
] as const;

/** RF25 — agendamentos recebidos pelo salão. */
export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sessao = await auth();
  const salao = await salaoDoDono(sessao!.user.id);
  if (!salao) return <SemSalao />;

  const { status } = await searchParams;
  const filtro = FILTROS.some((f) => f.chave === status) ? status! : "PENDENTE";

  const agendamentos = await listarAgendamentosDoSalao(salao.id, {
    status: filtro === "TODOS" ? undefined : (filtro as StatusAgendamento),
  });

  // Contagem de pendentes para o aviso, independente do filtro aplicado.
  const pendentes = await listarAgendamentosDoSalao(salao.id, { status: "PENDENTE" });

  return (
    <div className="space-y-6">
      <nav aria-label="Filtrar por status" className="flex flex-wrap gap-2">
        {FILTROS.map(({ chave, rotulo }) => (
          <Link
            key={chave}
            href={`/salao/meu/agenda?status=${chave}`}
            aria-current={filtro === chave ? "page" : undefined}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              filtro === chave
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {rotulo}
            {chave === "PENDENTE" && pendentes.length > 0 && (
              <span
                className={cn(
                  "ml-1.5 rounded-full px-1.5 text-xs font-bold",
                  filtro === chave ? "bg-primary-foreground/20" : "bg-amber-100 text-amber-800",
                )}
              >
                {pendentes.length}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {agendamentos.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            {filtro === "PENDENTE"
              ? "Nenhum agendamento aguardando confirmação."
              : "Nenhum agendamento com esse status."}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {agendamentos.map((agendamento) => {
            const rotulo = statusLegivel(agendamento.status);

            return (
              <li key={agendamento.id}>
                <Card>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-medium">
                          <User className="size-4 text-muted-foreground" aria-hidden />
                          {agendamento.cliente.nome}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {agendamento.servico.nome} · {precoEmReais(agendamento.servico.preco)} ·{" "}
                          {duracaoLegivel(agendamento.duracaoMin)}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${rotulo.classe}`}>
                        {rotulo.rotulo}
                      </span>
                    </div>

                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="flex items-center gap-1.5 first-letter:uppercase">
                        <CalendarDays className="size-3.5 text-muted-foreground" aria-hidden />
                        {dataPorExtenso(agendamento.data)}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="size-3.5 text-muted-foreground" aria-hidden />
                        {agendamento.hora}
                      </span>
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                      <AcoesDoAgendamento agendamentoId={agendamento.id} status={agendamento.status} />
                      <Link
                        href={`/salao/meu/agenda/${agendamento.id}`}
                        className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                      >
                        Ver detalhe
                        <ChevronRight className="size-4" aria-hidden />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
