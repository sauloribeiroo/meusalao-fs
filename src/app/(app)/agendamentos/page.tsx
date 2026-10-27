import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CalendarX, Clock, MapPin, Star } from "lucide-react";
import { auth } from "@/auth";
import { BotaoCancelar } from "@/app/(app)/agendamentos/botao-cancelar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { dataPorExtenso, duracaoLegivel, precoEmReais, statusLegivel } from "@/lib/formato";
import {
  listarAgendamentosDoCliente,
  type AgendamentoPublico,
} from "@/services/agendamentos/agendamentos.service";
import { agendamentosAvaliadosDoCliente } from "@/services/avaliacoes/avaliacoes.service";

export const metadata: Metadata = { title: "Meus agendamentos | MeuSalão" };

/** Status em que ainda há atendimento pela frente. */
const EM_ABERTO = ["PENDENTE", "CONFIRMADO"];

/**
 * RF17 — agendamentos do cliente.
 *
 * A lista é dividida em "próximos" e "anteriores" em vez de filtrada por abas:
 * o que o cliente procura aqui quase sempre é o atendimento que ainda vai
 * acontecer, e ele deve estar visível sem precisar escolher um filtro antes.
 */
export default async function MeusAgendamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ avaliado?: string }>;
}) {
  const sessao = await auth();
  const { avaliado } = await searchParams;

  const [agendamentos, avaliados] = await Promise.all([
    listarAgendamentosDoCliente(sessao!.user.id),
    agendamentosAvaliadosDoCliente(sessao!.user.id),
  ]);

  const agora = Date.now();
  const proximos = agendamentos
    .filter((a) => EM_ABERTO.includes(a.status) && new Date(a.dataHora).getTime() > agora)
    .reverse(); // o serviço devolve do mais recente para o mais antigo
  const idsProximos = new Set(proximos.map((a) => a.id));
  const anteriores = agendamentos.filter((a) => !idsProximos.has(a.id));

  return (
    <>
      <header className="bg-brand-dark">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <h1 className="text-3xl font-black tracking-tight text-white">Meus agendamentos</h1>
          <p className="mt-1 text-white/70">Acompanhe, cancele e avalie seus atendimentos.</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-6 py-8">
        {avaliado && (
          <p className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
            <Star className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>Avaliação enviada. Obrigado por ajudar outros clientes a escolher.</span>
          </p>
        )}

        {agendamentos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <CalendarX className="size-6 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">Você ainda não tem agendamentos.</p>
              <Link href="/saloes" className={buttonVariants({ size: "sm" })}>
                Encontrar um salão
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <Secao titulo="Próximos" vazio="Nenhum atendimento marcado.">
              {proximos.map((agendamento) => (
                <CartaoAgendamento key={agendamento.id} agendamento={agendamento} podeCancelar />
              ))}
            </Secao>

            <Secao titulo="Anteriores" vazio="Nada no histórico ainda.">
              {anteriores.map((agendamento) => (
                <CartaoAgendamento
                  key={agendamento.id}
                  agendamento={agendamento}
                  jaAvaliado={avaliados.has(agendamento.id)}
                />
              ))}
            </Secao>
          </>
        )}
      </main>
    </>
  );
}

function Secao({
  titulo,
  vazio,
  children,
}: {
  titulo: string;
  vazio: string;
  children: React.ReactNode[];
}) {
  return (
    <section aria-labelledby={titulo}>
      <h2 id={titulo} className="mb-4 text-lg font-semibold">
        {titulo}
      </h2>
      {children.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">{vazio}</CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">{children}</ul>
      )}
    </section>
  );
}

function CartaoAgendamento({
  agendamento,
  podeCancelar = false,
  jaAvaliado = false,
}: {
  agendamento: AgendamentoPublico;
  podeCancelar?: boolean;
  jaAvaliado?: boolean;
}) {
  const rotulo = statusLegivel(agendamento.status);
  // RGN03: avaliar só atendimento concluído, uma vez só.
  const podeAvaliar = agendamento.status === "CONCLUIDO" && !jaAvaliado;

  return (
    <li>
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{agendamento.salao.nome}</p>
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
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden />
              {agendamento.salao.endereco}
            </span>
          </p>

          {(podeCancelar || podeAvaliar || jaAvaliado) && (
            <div className="border-t border-border pt-4">
              {podeCancelar && <BotaoCancelar agendamentoId={agendamento.id} />}

              {podeAvaliar && (
                <Link
                  href={`/agendamentos/${agendamento.id}/avaliar`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Star aria-hidden />
                  Avaliar atendimento
                </Link>
              )}

              {jaAvaliado && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Star className="size-4 text-amber-500" aria-hidden />
                  Você já avaliou este atendimento.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </li>
  );
}
