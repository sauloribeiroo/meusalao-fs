import type { Metadata } from "next";
import { MapPin, Search, Star } from "lucide-react";
import { BotaoModerar } from "@/app/(app)/admin/saloes/botao-moderar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { listarSaloesParaAdmin } from "@/services/admin/admin.service";

export const metadata: Metadata = { title: "Salões | MeuSalão" };

/** RF26 — todos os salões, publicados ou não. */
export default async function SaloesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ termo?: string }>;
}) {
  const { termo } = await searchParams;
  const saloes = await listarSaloesParaAdmin(termo || undefined);

  return (
    <div className="space-y-5">
      <form className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            name="termo"
            defaultValue={termo}
            placeholder="Buscar salão pelo nome"
            aria-label="Buscar salão pelo nome"
            className="pl-9"
          />
        </div>
        <button
          type="submit"
          className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Buscar
        </button>
      </form>

      {saloes.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Nenhum salão encontrado.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {saloes.map((salao) => (
            <li key={salao.id}>
              <Card>
                <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {salao.nome}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          salao.publicado
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800",
                        )}
                      >
                        {salao.publicado ? "Publicado" : "Fora do ar"}
                      </span>
                    </p>

                    <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      {salao.endereco}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Dono: {salao.dono.nome} ({salao.dono.email})
                    </p>

                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                      <span>{salao.totalServicos} serviço(s)</span>
                      <span>{salao.totalAgendamentos} agendamento(s)</span>
                      {salao.notaMedia !== null && (
                        <span className="flex items-center gap-1">
                          <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                          {salao.notaMedia.toFixed(1).replace(".", ",")} ({salao.totalAvaliacoes})
                        </span>
                      )}
                    </p>
                  </div>

                  <BotaoModerar salaoId={salao.id} publicado={salao.publicado} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
