"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, Store, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ABAS = [
  { href: "/admin", rotulo: "Resumo", Icone: LayoutDashboard },
  { href: "/admin/usuarios", rotulo: "Usuários", Icone: Users },
  { href: "/admin/saloes", rotulo: "Salões", Icone: Store },
  { href: "/admin/avaliacoes", rotulo: "Avaliações", Icone: MessageSquare },
];

export function AbasDoAdmin() {
  const caminho = usePathname();

  // Rola dentro do próprio container em telas estreitas, em vez de arrastar a página.
  return (
    <nav aria-label="Seções da administração" className="-mb-px mt-6 flex gap-1 overflow-x-auto">
      {ABAS.map(({ href, rotulo, Icone }) => {
        // "/admin" é prefixo de todas: só casa exato, as demais aceitam subrotas.
        const ativa = href === "/admin" ? caminho === href : caminho.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={ativa ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              ativa
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icone className="size-4" aria-hidden />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
