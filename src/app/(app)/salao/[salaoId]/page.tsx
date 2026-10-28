import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, Phone, Star, Tag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { duracaoLegivel, precoEmReais } from "@/lib/formato";
import { listarAvaliacoesDoSalao } from "@/services/avaliacoes/avaliacoes.service";
import { ErroNaoEncontrado } from "@/services/erros";
import { buscarPerfilPublico } from "@/services/saloes/saloes.service";

export const metadata: Metadata = { title: "Salão | MeuSalão" };

const DIA_LEGIVEL: Record<string, string> = {
  DOM: "Domingo",
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
  SAB: "Sábado",
};

const ORDEM_DOS_DIAS = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];

/** RF14 — perfil público do salão. */
export default async function PerfilDoSalaoPage({ params }: { params: Promise<{ salaoId: string }> }) {
  const { salaoId } = await params;

  const salao = await buscarPerfilPublico(salaoId).catch((erro) => {
    if (erro instanceof ErroNaoEncontrado) notFound();
    throw erro;
  });

  const avaliacoes = await listarAvaliacoesDoSalao(salao.id);
  const comComentario = avaliacoes.filter((avaliacao) => avaliacao.comentario !== null);

  const horarios = [...salao.horarios].sort(
    (a, b) => ORDEM_DOS_DIAS.indexOf(a.diaSemana) - ORDEM_DOS_DIAS.indexOf(b.diaSemana),
  );

  return (
    <>
      <header className="bg-brand-dark">
        <div className="mx-auto max-w-4xl px-6 py-10">
          {salao.tipo && <p className="mb-1 text-sm font-semibold text-white/60">{salao.tipo}</p>}
          <h1 className="text-3xl font-black tracking-tight text-white">{salao.nome}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
            <span className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              {salao.endereco}
            </span>

            {salao.telefone && (
              <span className="flex items-center gap-1.5">
                <Phone className="size-4" aria-hidden />
                {salao.telefone}
              </span>
            )}

            {salao.notaMedia !== null && (
              <span className="flex items-center gap-1.5">
                <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                <strong className="font-bold text-white">
                  {salao.notaMedia.toFixed(1).replace(".", ",")}
                </strong>
                ({salao.totalAvaliacoes})
              </span>
            )}
          </div>

          {salao.descricao && <p className="mt-4 max-w-2xl text-white/80">{salao.descricao}</p>}

          <Link href={`/salao/${salao.id}/agendar`} className={`${buttonVariants()} mt-6`}>
            <CalendarDays aria-hidden />
            Agendar atendimento
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-6 py-8">
        <section aria-labelledby="servicos">
          <h2 id="servicos" className="mb-4 text-lg font-semibold">
            Serviços <span className="font-normal text-muted-foreground">({salao.servicos.length})</span>
          </h2>

          {salao.servicos.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Este salão ainda não cadastrou serviços.
              </CardContent>
            </Card>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {salao.servicos.map((servico) => (
                <li key={servico.id}>
                  <Card className="h-full">
                    <CardContent className="flex h-full flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="font-medium">{servico.nome}</p>
                        <p className="mt-1 flex items-center gap-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Tag className="size-3.5" aria-hidden />
                            {precoEmReais(servico.preco)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="size-3.5" aria-hidden />
                            {duracaoLegivel(servico.duracaoMin)}
                          </span>
                        </p>
                      </div>
                      <Link
                        href={`/salao/${salao.id}/agendar/horario?servicoId=${servico.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Agendar
                      </Link>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="horarios">
          <h2 id="horarios" className="mb-4 text-lg font-semibold">
            Horário de funcionamento
          </h2>

          <Card>
            <CardContent className="p-5">
              {horarios.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este salão ainda não informou os dias de funcionamento.
                </p>
              ) : (
                <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                  {horarios.map((horario) => (
                    <div key={horario.diaSemana} className="flex justify-between gap-4 text-sm">
                      <dt className="text-muted-foreground">{DIA_LEGIVEL[horario.diaSemana]}</dt>
                      <dd className="font-medium">
                        {horario.horaAbertura} às {horario.horaFechamento}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="avaliacoes">
          <h2 id="avaliacoes" className="mb-4 text-lg font-semibold">
            Avaliações{" "}
            <span className="font-normal text-muted-foreground">({salao.totalAvaliacoes})</span>
          </h2>

          {comComentario.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                {salao.totalAvaliacoes === 0
                  ? "Este salão ainda não recebeu avaliações."
                  : "As avaliações recebidas não têm comentário."}
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-3">
              {comComentario.map((avaliacao) => (
                <li key={avaliacao.id}>
                  <Card>
                    <CardContent className="space-y-2 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{avaliacao.cliente.nome}</p>
                        <p
                          className="flex items-center gap-1 text-sm font-semibold"
                          aria-label={`Nota ${avaliacao.nota} de 5`}
                        >
                          <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                          {avaliacao.nota}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">{avaliacao.servico.nome}</p>
                      <p className="text-sm">{avaliacao.comentario}</p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
