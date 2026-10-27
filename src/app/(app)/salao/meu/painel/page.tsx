import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  Clock,
  Star,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { auth } from "@/auth";
import { SemSalao } from "@/components/sem-salao";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { dataPorExtenso, duracaoLegivel, precoEmReais, statusLegivel } from "@/lib/formato";
import { metricasDoSalao } from "@/services/saloes/metricas.service";
import { salaoDoDono } from "@/services/saloes/saloes.service";

export const metadata: Metadata = { title: "Painel | MeuSalão" };

const MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** RF24 — métricas do salão e agenda do dia. */
export default async function PainelPage() {
  const sessao = await auth();
  const resumo = await salaoDoDono(sessao!.user.id);
  if (!resumo) return <SemSalao />;

  const metricas = await metricasDoSalao(resumo.id);

  return (
    <div className="space-y-8">
      <section aria-labelledby="numeros">
        <h2 id="numeros" className="sr-only">
          Números do salão
        </h2>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Indicador
            Icone={CalendarCheck}
            rotulo="Agendamentos hoje"
            valor={String(metricas.agendamentosHoje)}
            detalhe={
              metricas.pendentes > 0
                ? `${metricas.pendentes} aguardando confirmação`
                : "Nada pendente de confirmação"
            }
            destaque={metricas.pendentes > 0}
          />
          <Indicador
            Icone={CalendarDays}
            rotulo="Últimos 7 dias"
            valor={String(metricas.agendamentosSemana)}
            detalhe="Atendimentos marcados"
          />
          <Indicador
            Icone={Users}
            rotulo="Clientes atendidos"
            valor={String(metricas.clientesAtendidos)}
            detalhe="Pessoas distintas, no total"
          />
          <Indicador
            Icone={TrendingUp}
            rotulo="Receita em 30 dias"
            valor={MOEDA.format(metricas.receitaMes)}
            detalhe={
              metricas.concluidosSemPreco > 0
                ? `${metricas.concluidosSemPreco} atendimento(s) sem preço cadastrado`
                : "Somando os atendimentos concluídos"
            }
          />
        </ul>
      </section>

      <section aria-labelledby="avaliacoes">
        <h2 id="avaliacoes" className="mb-4 text-lg font-semibold">
          Avaliações
        </h2>
        <Card>
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-5">
            {metricas.avaliacoes.notaMedia === null ? (
              <p className="text-sm text-muted-foreground">
                Seu salão ainda não recebeu avaliações. Elas aparecem depois que um atendimento é
                concluído e o cliente avalia.
              </p>
            ) : (
              <>
                <p className="flex items-baseline gap-1.5">
                  <Star className="size-5 translate-y-0.5 fill-amber-400 text-amber-400" aria-hidden />
                  <span className="text-2xl font-black">
                    {metricas.avaliacoes.notaMedia.toFixed(1).replace(".", ",")}
                  </span>
                  <span className="text-sm text-muted-foreground">de 5</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {metricas.avaliacoes.total}{" "}
                  {metricas.avaliacoes.total === 1 ? "avaliação" : "avaliações"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="agenda-do-dia">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="agenda-do-dia" className="text-lg font-semibold">
            Agenda de hoje
          </h2>
          <Link href="/salao/meu/agenda" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Ver agenda completa
          </Link>
        </div>

        <p className="mb-3 text-sm text-muted-foreground first-letter:uppercase">
          <span className="block first-letter:uppercase">{dataPorExtenso(metricas.hoje)}</span>
        </p>

        {metricas.agendaDoDia.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Nenhum atendimento marcado para hoje.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {metricas.agendaDoDia.map((agendamento) => {
              const rotulo = statusLegivel(agendamento.status);

              return (
                <li key={agendamento.id}>
                  <Link href={`/salao/meu/agenda/${agendamento.id}`} className="block">
                    <Card className="transition-colors hover:border-primary">
                      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                        <p className="flex items-center gap-1.5 font-semibold">
                          <Clock className="size-4 text-muted-foreground" aria-hidden />
                          {agendamento.hora}
                        </p>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 font-medium">
                            <UserRound className="size-4 text-muted-foreground" aria-hidden />
                            {agendamento.cliente.nome}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {agendamento.servico.nome} · {precoEmReais(agendamento.servico.preco)} ·{" "}
                            {duracaoLegivel(agendamento.duracaoMin)}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${rotulo.classe}`}>
                          {rotulo.rotulo}
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Indicador({
  Icone,
  rotulo,
  valor,
  detalhe,
  destaque = false,
}: {
  Icone: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  rotulo: string;
  valor: string;
  detalhe: string;
  destaque?: boolean;
}) {
  return (
    <li>
      <Card className={destaque ? "border-amber-300" : undefined}>
        <CardContent className="p-5">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Icone className="size-4" aria-hidden />
            {rotulo}
          </p>
          <p className="mt-1 text-2xl font-black tracking-tight">{valor}</p>
          <p className={`mt-1 text-xs ${destaque ? "font-semibold text-amber-700" : "text-muted-foreground"}`}>
            {detalhe}
          </p>
        </CardContent>
      </Card>
    </li>
  );
}
