import { Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Estado para o dono que ainda não tem salão.
 *
 * O cadastro de salão (RF03) é a issue #8 e ainda não existe — até lá, o salão
 * vem do seed de desenvolvimento. Esta tela evita que a gestão apareça vazia e
 * sem explicação.
 */
export function SemSalao() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        <Store className="size-7 text-muted-foreground" aria-hidden />
        <div>
          <p className="font-medium">Nenhum salão cadastrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            O cadastro de salão chega na próxima entrega. Em desenvolvimento, rode{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">npm run db:seed</code> para criar um
            salão de demonstração.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
