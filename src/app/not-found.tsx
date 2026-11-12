import type { Metadata } from "next";
import Link from "next/link";
import { House, ScissorsLineDashed } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Página não encontrada | MeuSalão" };

/**
 * 404 da aplicação inteira: endereço digitado errado, link antigo ou salão que
 * não existe mais (as páginas chamam `notFound()`). Leva para /inicio — quem
 * não estiver logado é mandado ao login pelo middleware.
 */
export default function NaoEncontrado() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ScissorsLineDashed className="size-8" aria-hidden />
      </div>

      <p className="text-sm font-semibold uppercase tracking-wider text-primary">Erro 404</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">Página não encontrada</h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        O endereço pode estar errado ou a página foi removida. Volte ao início para continuar
        procurando seu salão.
      </p>

      <Link href="/inicio" className={buttonVariants({ size: "lg", className: "mt-8" })}>
        <House aria-hidden />
        Voltar ao início
      </Link>
    </main>
  );
}
