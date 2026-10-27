import type { Metadata } from "next";
import { Star } from "lucide-react";
import { BotaoRemoverComentario } from "@/app/(app)/admin/avaliacoes/botao-remover-comentario";
import { Card, CardContent } from "@/components/ui/card";
import { listarAvaliacoesParaModeracao } from "@/services/admin/admin.service";

export const metadata: Metadata = { title: "Moderação | MeuSalão" };

/** RF26 — moderação das avaliações com comentário. */
export default async function AvaliacoesAdminPage() {
  const avaliacoes = await listarAvaliacoesParaModeracao();

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Só aparecem aqui as avaliações com comentário. Remover o texto preserva a nota, para não
        distorcer a média do salão.
      </p>

      {avaliacoes.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Nenhuma avaliação com comentário até agora.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {avaliacoes.map((avaliacao) => (
            <li key={avaliacao.id}>
              <Card>
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{avaliacao.salao.nome}</p>
                      <p className="text-sm text-muted-foreground">por {avaliacao.cliente.nome}</p>
                    </div>

                    <p
                      className="flex items-center gap-1 text-sm font-semibold"
                      aria-label={`Nota ${avaliacao.nota} de 5`}
                    >
                      <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                      {avaliacao.nota}
                    </p>
                  </div>

                  <blockquote className="border-l-2 border-border pl-3 text-sm">
                    {avaliacao.comentario}
                  </blockquote>

                  <div className="border-t border-border pt-3">
                    <BotaoRemoverComentario avaliacaoId={avaliacao.id} />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
