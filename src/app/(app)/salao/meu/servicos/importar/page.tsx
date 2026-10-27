import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { Importador } from "@/app/(app)/salao/meu/servicos/importar/importador";
import { SemSalao } from "@/components/sem-salao";
import { salaoDoDono } from "@/services/saloes/saloes.service";

export const metadata: Metadata = { title: "Importar serviços | MeuSalão" };

/** RF21 — importação do catálogo por CSV. */
export default async function ImportarServicosPage() {
  const sessao = await auth();
  const salao = await salaoDoDono(sessao!.user.id);
  if (!salao) return <SemSalao />;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/salao/meu/servicos"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Serviços
        </Link>
        <h2 className="mt-2 text-xl font-bold tracking-tight">Importar catálogo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Envie uma planilha em CSV para cadastrar vários serviços de uma vez.
        </p>
      </div>

      <Importador />
    </div>
  );
}
