"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

const ABAS = [
  { href: "/salao/meu/servicos", rotulo: "Serviços", Icone: Scissors },
  { href: "/salao/meu/horarios", rotulo: "Horários", Icone: CalendarClock },
];

export function AbasDoSalao() {
  const caminho = usePathname();

  return (
    <nav aria-label="Seções do salão" className="-mb-px mt-6 flex gap-1">
      {ABAS.map(({ href, rotulo, Icone }) => {
        const ativa = caminho === href;

        return (
          <Link
            key={href}
            href={href}
            aria-current={ativa ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition-colors",
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
