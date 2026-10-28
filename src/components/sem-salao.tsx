import Link from "next/link";
import { Store } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Estado para quem tem papel de dono mas ainda não cadastrou um salão. */
export function SemSalao() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
        <Store className="size-7 text-muted-foreground" aria-hidden />
        <div>
          <p className="font-medium">Nenhum salão cadastrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre seu salão para liberar serviços, horários e agenda.
          </p>
        </div>
        <Link href="/salao/novo" className={buttonVariants()}>
          Cadastrar salão
        </Link>
      </CardContent>
    </Card>
  );
}
