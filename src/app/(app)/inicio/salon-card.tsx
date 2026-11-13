import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type SalonCardData = {
  id: string;
  nome: string;
  endereco: string;
  tipo?: string | null;
  notaMedia?: number | null;
  totalAvaliacoes?: number | null;
  distanciaKm?: number | null;
  faixaPreco?: number | null;
  servicos?: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function SalonCard({ salao }: { salao: SalonCardData }) {
  const temAvaliacao = typeof salao.notaMedia === "number";
  const temDistancia = typeof salao.distanciaKm === "number";
  const temFaixaPreco = typeof salao.faixaPreco === "number" && salao.faixaPreco > 0;
  const servicosVisiveis = Array.isArray(salao.servicos) ? salao.servicos.slice(0, 3) : [];

  return (
    <Link
      href={`/salao/${salao.id}`}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <Card className="flex h-full flex-col overflow-hidden rounded-2xl border-border bg-card shadow-xs transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
        <CardContent className="flex flex-1 flex-col justify-between p-5">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground transition-colors duration-150 group-hover:text-primary sm:text-lg">
              {salao.nome}
            </h3>

            {salao.tipo && (
              <p className="mt-0.5 truncate text-xs font-medium text-primary">{salao.tipo}</p>
            )}

            {temAvaliacao && (
              <div className="mt-2 flex items-center gap-1.5 text-sm">
                <Star
                  className="size-4 shrink-0 fill-amber-400 text-amber-400"
                  aria-label="Avaliação"
                />
                <span className="font-semibold text-foreground">
                  {salao.notaMedia!.toFixed(1).replace(".", ",")}
                </span>
                {typeof salao.totalAvaliacoes === "number" && (
                  <span className="text-muted-foreground">({salao.totalAvaliacoes})</span>
                )}
              </div>
            )}

            {(temDistancia || temFaixaPreco) && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {temDistancia && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5 shrink-0 text-primary" aria-label="Distância" />
                    <span>{salao.distanciaKm!.toFixed(1).replace(".", ",")} km</span>
                  </span>
                )}

                {temFaixaPreco && (
                  <span
                    className="inline-flex items-center tracking-tight"
                    aria-label={`Faixa de preço ${salao.faixaPreco} de 3`}
                  >
                    {[1, 2, 3].map((nivel) => (
                      <span
                        key={nivel}
                        className={
                          nivel <= salao.faixaPreco!
                            ? "font-semibold text-primary"
                            : "text-muted-foreground/35"
                        }
                      >
                        $
                      </span>
                    ))}
                  </span>
                )}
              </div>
            )}

            <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin
                className="mt-0.5 size-4 shrink-0 text-muted-foreground/80"
                aria-label="Endereço"
              />
              <span className="line-clamp-2 leading-relaxed">{salao.endereco}</span>
            </p>

            {servicosVisiveis.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {servicosVisiveis.map((servico) => (
                  <span
                    key={servico}
                    className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                  >
                    {servico}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-2">
            <span className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition-colors duration-150 group-hover:bg-primary/90">
              Ver salão
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
