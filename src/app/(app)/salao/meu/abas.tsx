"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, CalendarClock, LayoutDashboard, Scissors, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const ABAS = [
  { href: "/salao/meu/painel", rotulo: "Painel", Icone: LayoutDashboard },
  { href: "/salao/meu/agenda", rotulo: "Agenda", Icone: CalendarCheck },
  { href: "/salao/meu/dados", rotulo: "Dados", Icone: Store },
  { href: "/salao/meu/servicos", rotulo: "Serviços", Icone: Scissors },
  { href: "/salao/meu/horarios", rotulo: "Horários", Icone: CalendarClock },
];

export function AbasDoSalao() {
  const caminho = usePathname();

  // As quatro abas não cabem na largura de um celular: rolam dentro do próprio
  // container, em vez de arrastar a página inteira para o lado.
  return (
    <nav aria-label="Seções do salão" className="-mb-px mt-6 flex gap-1 overflow-x-auto">
      {ABAS.map(({ href, rotulo, Icone }) => {
        // startsWith para a aba seguir marcada no detalhe (/agenda/[id]).
        const ativa = caminho === href || caminho.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={ativa ? "page" : undefined}
            className={cn(
              // shrink-0 e nowrap: sem eles o flex comprime as abas e quebra o
              // rótulo em duas linhas, em vez de deixar o container rolar.
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
