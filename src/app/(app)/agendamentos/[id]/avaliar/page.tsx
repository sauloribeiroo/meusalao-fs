import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { auth } from "@/auth";
import { FormularioAvaliacao } from "@/app/(app)/agendamentos/[id]/avaliar/formulario-avaliacao";
import { Card, CardContent } from "@/components/ui/card";
import { dataPorExtenso } from "@/lib/formato";
import { buscarAgendamentoVisivelPara } from "@/services/agendamentos/agendamentos.service";
import { agendamentosAvaliadosDoCliente } from "@/services/avaliacoes/avaliacoes.service";
import { ErroNaoEncontrado } from "@/services/erros";

export const metadata: Metadata = { title: "Avaliar atendimento | MeuSalão" };

/** RF19 — tela de avaliação de um atendimento concluído. */
export default async function AvaliarPage({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await auth();
  const { id } = await params;

  const agendamento = await buscarAgendamentoVisivelPara(
    { id: sessao!.user.id, papel: sessao!.user.papel },
    id,
  ).catch((erro) => {
    if (erro instanceof ErroNaoEncontrado) notFound();
    throw erro;
  });

  // As duas regras da RGN03 também valem aqui, não só na ação: chegar pela URL
  // num atendimento ainda não concluído, ou já avaliado, não pode abrir o
  // formulário só para receber o erro depois de preenchê-lo.
  if (agendamento.status !== "CONCLUIDO") redirect("/agendamentos");

  const avaliados = await agendamentosAvaliadosDoCliente(sessao!.user.id);
  if (avaliados.has(agendamento.id)) redirect("/agendamentos");

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <Link
        href="/agendamentos"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Meus agendamentos
      </Link>

      <h1 className="text-3xl font-black tracking-tight">Como foi o atendimento?</h1>
      <p className="mt-1 text-muted-foreground">
        Sua avaliação aparece no perfil do salão e ajuda quem ainda está escolhendo.
      </p>

      <Card className="mt-6">
        <CardContent className="space-y-1 p-5">
          <p className="font-medium">{agendamento.salao.nome}</p>
          <p className="text-sm text-muted-foreground">{agendamento.servico.nome}</p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground first-letter:uppercase">
            <CalendarDays className="size-3.5" aria-hidden />
            <span className="block first-letter:uppercase">
              {dataPorExtenso(agendamento.data)} às {agendamento.hora}
            </span>
          </p>
        </CardContent>
      </Card>

      <div className="mt-8">
        <FormularioAvaliacao agendamentoId={agendamento.id} />
      </div>
    </main>
  );
}
