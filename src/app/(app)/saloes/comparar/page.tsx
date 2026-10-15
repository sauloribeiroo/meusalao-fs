import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { duracaoLegivel, precoEmReais } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { distanciaLegivel } from "@/services/saloes/distancia";
import { compararSaloes, type SalaoComparado } from "@/services/saloes/saloes.service";

export const metadata: Metadata = { title: "Comparar salões | MeuSalão" };

/**
 * RF13 — comparação lado a lado.
 *
 * Os salões vêm por id na URL, e não de estado no cliente: assim o link pode
 * ser copiado, compartilhado ou recarregado sem perder a seleção.
 */
export default async function CompararPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const saloes = await compararSaloes((ids ?? "").split(",").filter(Boolean));

  if (saloes.length < 2) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Card>
          <CardContent className="space-y-4 p-10 text-center">
            <p className="font-medium">Nada para comparar ainda</p>
            <p className="text-sm text-muted-foreground">
              Escolha ao menos dois salões na lista para ver os preços, os serviços e as avaliações
              lado a lado.
            </p>
            <Link href="/saloes" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft aria-hidden />
              Voltar para a lista
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  // União dos serviços de todos os salões, para cada linha da tabela existir
  // mesmo quando só um deles oferece aquele serviço.
  const nomesDeServicos = [...new Set(saloes.flatMap((salao) => salao.servicos.map((s) => s.nome)))].sort(
    (a, b) => a.localeCompare(b, "pt-BR"),
  );

  const precoDe = (salao: SalaoComparado, nome: string) =>
    salao.servicos.find((servico) => servico.nome === nome);

  /** Menor preço de cada serviço, para destacar quem está mais barato. */
  const menorPreco = new Map(
    nomesDeServicos.map((nome) => {
      const precos = saloes
        .map((salao) => precoDe(salao, nome)?.preco)
        .filter((preco): preco is number => typeof preco === "number");

      return [nome, precos.length ? Math.min(...precos) : null];
    }),
  );

  return (
    <>
      <header className="bg-brand-dark">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-3xl font-black tracking-tight text-white">Comparar salões</h1>
          <p className="mt-1 text-white/70">
            Preços, serviços e avaliações lado a lado. O menor preço de cada serviço aparece
            destacado.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Comparação entre os salões selecionados</caption>
            <thead>
              <tr>
                <th scope="col" className="w-40 p-3 text-left align-bottom font-medium text-muted-foreground">
                  Serviço
                </th>
                {saloes.map((salao) => (
                  <th key={salao.id} scope="col" className="min-w-44 p-3 text-left align-bottom">
                    <span className="block font-semibold">{salao.nome}</span>
                    {salao.tipo && <span className="block text-xs font-normal text-primary">{salao.tipo}</span>}
                    <Link
                      href={`/salao/${salao.id}/agendar`}
                      className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                    >
                      Agendar neste salão →
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border border-y border-border">
              <tr>
                <th scope="row" className="p-3 text-left font-medium text-muted-foreground">
                  Avaliação
                </th>
                {saloes.map((salao) => (
                  <td key={salao.id} className="p-3">
                    {salao.notaMedia === null ? (
                      <span className="text-muted-foreground">Sem avaliações</span>
                    ) : (
                      <span className="flex items-center gap-1 font-medium">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
                        {salao.notaMedia.toFixed(1).replace(".", ",")}
                        <span className="font-normal text-muted-foreground">({salao.totalAvaliacoes})</span>
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <th scope="row" className="p-3 text-left font-medium text-muted-foreground">
                  Endereço
                </th>
                {saloes.map((salao) => (
                  <td key={salao.id} className="p-3 text-muted-foreground">
                    {salao.endereco}
                    {salao.distanciaKm !== null && (
                      <span className="mt-1 block text-xs text-primary">
                        {distanciaLegivel(salao.distanciaKm)} de você
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <th scope="row" className="p-3 text-left font-medium text-muted-foreground">
                  Serviços oferecidos
                </th>
                {saloes.map((salao) => (
                  <td key={salao.id} className="p-3">
                    {salao.servicos.length}
                  </td>
                ))}
              </tr>

              {nomesDeServicos.map((nome) => (
                <tr key={nome}>
                  <th scope="row" className="p-3 text-left font-normal">
                    {nome}
                  </th>
                  {saloes.map((salao) => {
                    const servico = precoDe(salao, nome);
                    const ehMenor =
                      servico?.preco != null && menorPreco.get(nome) === servico.preco && saloes.length > 1;

                    return (
                      <td key={salao.id} className="p-3">
                        {servico ? (
                          <>
                            <span
                              className={cn(
                                "font-medium",
                                ehMenor && "rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800",
                              )}
                            >
                              {precoEmReais(servico.preco)}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {duracaoLegivel(servico.duracaoMin)}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Link href="/saloes" className={cn(buttonVariants({ variant: "outline" }), "mt-8")}>
          <ArrowLeft aria-hidden />
          Voltar para a lista
        </Link>
      </main>
    </>
  );
}
