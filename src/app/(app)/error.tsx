"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * Erro inesperado em qualquer tela da área logada (banco fora do ar, falha no
 * servidor). O cabeçalho continua na tela, e o usuário pode tentar de novo sem
 * recarregar a página inteira.
 */
export default function ErroDaPagina({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <TriangleAlert className="size-7" aria-hidden />
      </div>

      <h1 className="text-2xl font-black tracking-tight">Algo deu errado</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Não foi possível carregar esta página agora. Tente de novo em alguns instantes.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={reset}>
          <RotateCcw aria-hidden />
          Tentar de novo
        </Button>
        <Link href="/inicio" className={buttonVariants({ variant: "outline" })}>
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
