import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock, MapPin, Scissors } from "lucide-react";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { dataPorExtenso, duracaoLegivel, precoEmReais, statusLegivel } from "@/lib/formato";
import { buscarAgendamentoVisivelPara } from "@/services/agendamentos/agendamentos.service";
import { ErroDeNegocio } from "@/services/erros";

export const metadata: Metadata = { title: "Agendamento confirmado | MeuSalão" };

type Props = {
  params: Promise<{ salaoId: string }>;
  searchParams: Promise<{ agendamento?: string }>;
};

/** RF16 — resumo do agendamento recém-criado. */
export default async function SucessoPage({ params, searchParams }: Props) {
  const { salaoId } = await params;
  const { agendamento: agendamentoId } = await searchParams;
  if (!agendamentoId) notFound();

  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  // O serviço já responde "não encontrado" para quem não tem relação com o
  // agendamento, então ninguém lê o horário de outra pessoa pela URL.
  const agendamento = await buscar(sessao.user, agendamentoId);
  if (!agendamento || agendamento.salao.id !== salaoId) notFound();

  const status = statusLegivel(agendamento.status);

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
        <h1 className="mt-4 text-2xl font-black tracking-tight">Agendamento registrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O salão vai confirmar seu horário. Você acompanha a situação em Meus agendamentos.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.classe}`}
          >
            {status.rotulo}
          </span>

          <dl className="space-y-3 text-sm">
            <Item Icone={MapPin} rotulo="Salão">
              {agendamento.salao.nome}
              <span className="block text-muted-foreground">{agendamento.salao.endereco}</span>
            </Item>
            <Item Icone={Scissors} rotulo="Serviço">
              {agendamento.servico.nome}
              <span className="block text-muted-foreground">
                {precoEmReais(agendamento.servico.preco)} · {duracaoLegivel(agendamento.duracaoMin)}
              </span>
            </Item>
            <Item Icone={CalendarDays} rotulo="Dia">
              {/* block porque ::first-letter não se aplica a elemento inline. */}
              <span className="block first-letter:uppercase">{dataPorExtenso(agendamento.data)}</span>
            </Item>
            <Item Icone={Clock} rotulo="Horário">
              {agendamento.hora}
            </Item>
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/inicio" className={buttonVariants({ className: "flex-1" })}>
          Voltar ao início
        </Link>
        <Link
          href={`/salao/${salaoId}/agendar`}
          className={buttonVariants({ variant: "outline", className: "flex-1" })}
        >
          Agendar outro serviço
        </Link>
      </div>
    </main>
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

async function buscar(usuario: { id: string; papel: string }, agendamentoId: string) {
  try {
    return await buscarAgendamentoVisivelPara(usuario, agendamentoId);
  } catch (erro) {
    if (erro instanceof ErroDeNegocio) return null;
    throw erro;
  }
}
