import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  ChevronRight,
  EyeOff,
  MessageSquareWarning,
  Star,
  Store,
  UserPlus,
  Users,
} from "lucide-react";
import { AgendamentosPorStatus } from "@/app/(app)/admin/agendamentos-por-status";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { NOTA_BAIXA, resumoDaPlataforma } from "@/services/admin/admin.service";

export const metadata: Metadata = { title: "Administração | MeuSalão" };

/**
 * RF26 — resumo da plataforma.
 *
 * A primeira faixa é o que **exige ação** (salões parados fora do ar, avaliações
 * com nota baixa) e leva direto à aba onde se resolve. Os números gerais vêm
 * depois: são contexto, não tarefa.
 */
export default async function AdminPage() {
  const resumo = await resumoDaPlataforma();

  const pendencias = [
    {
      Icone: EyeOff,
      rotulo: "Salões fora do ar",
      valor: resumo.saloesAguardando,
      detalhe: "Cadastrados, mas ainda não publicados",
      href: "/admin/saloes",
    },
    {
      Icone: MessageSquareWarning,
      rotulo: `Avaliações nota ${NOTA_BAIXA} ou menos`,
      valor: resumo.avaliacoesBaixas,
      detalhe: "Vale ler antes que virem reclamação",
      href: "/admin/avaliacoes",
    },
  ];

  const numeros = [
    { Icone: Users, rotulo: "Usuários", valor: resumo.usuarios, detalhe: `${resumo.donos} donos de salão` },
    {
      Icone: UserPlus,
      rotulo: "Novos em 7 dias",
      valor: resumo.usuariosNovos,
      detalhe: "Contas criadas na última semana",
    },
    {
      Icone: Store,
      rotulo: "Salões",
      valor: resumo.saloes,
      detalhe: `${resumo.saloesPublicados} publicados`,
    },
    {
      Icone: CalendarCheck,
      rotulo: "Agendamentos",
      valor: resumo.agendamentos,
      detalhe: "Desde o início da plataforma",
    },
  ];

  return (
    <div className="space-y-8">
      <section aria-labelledby="pendencias">
        <h2 id="pendencias" className="mb-4 text-lg font-semibold">
          Precisa de atenção
        </h2>

        <ul className="grid gap-3 sm:grid-cols-2">
          {pendencias.map(({ Icone, rotulo, valor, detalhe, href }) => (
            <li key={rotulo}>
              <Link href={href} className="block h-full">
                <Card
                  className={cn(
                    "h-full transition-colors hover:border-primary",
                    valor > 0 && "border-amber-300",
                  )}
                >
                  <CardContent className="flex items-center justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Icone className="size-4" aria-hidden />
                        {rotulo}
                      </p>
                      <p className="mt-1 text-2xl font-black tracking-tight">{valor}</p>
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          valor > 0 ? "font-semibold text-amber-700" : "text-muted-foreground",
                        )}
                      >
                        {valor > 0 ? detalhe : "Nada pendente"}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="agendamentos">
        <h2 id="agendamentos" className="mb-4 text-lg font-semibold">
          Agendamentos por situação
        </h2>
        <Card>
          <CardContent className="p-5">
            <AgendamentosPorStatus dados={resumo.agendamentosPorStatus} />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="numeros">
        <h2 id="numeros" className="mb-4 text-lg font-semibold">
          Números gerais
        </h2>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {numeros.map(({ Icone, rotulo, valor, detalhe }) => (
            <li key={rotulo}>
              <Card className="h-full">
                <CardContent className="p-5">
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Icone className="size-4" aria-hidden />
                    {rotulo}
                  </p>
                  <p className="mt-1 text-2xl font-black tracking-tight">{valor}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="satisfacao">
        <h2 id="satisfacao" className="mb-4 text-lg font-semibold">
          Satisfação
        </h2>
        <Card>
          <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 p-5">
            {resumo.notaMedia === null ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma avaliação ainda. Elas aparecem depois que um atendimento é concluído e o
                cliente avalia.
              </p>
            ) : (
              <>
                <p className="flex items-baseline gap-1.5">
                  <Star className="size-5 translate-y-0.5 fill-amber-400 text-amber-400" aria-hidden />
                  <span className="text-2xl font-black">
                    {resumo.notaMedia.toFixed(1).replace(".", ",")}
                  </span>
                  <span className="text-sm text-muted-foreground">de 5 na plataforma</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {resumo.avaliacoes} {resumo.avaliacoes === 1 ? "avaliação" : "avaliações"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
