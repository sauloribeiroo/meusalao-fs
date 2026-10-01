import type { Metadata } from "next";
import Link from "next/link";
import {
  Baby,
  CalendarClock,
  Hand,
  MapPin,
  Paintbrush,
  Scissors,
  Search,
  Sparkles,
  SprayCan,
} from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Início | MeuSalão" };

// Sprint 2+: as categorias virão do banco, junto com a busca de salões.
const CATEGORIAS = [
  { nome: "Corte", Icone: Scissors },
  { nome: "Coloração", Icone: Paintbrush },
  { nome: "Manicure", Icone: Hand },
  { nome: "Barba", Icone: SprayCan },
  { nome: "Estética", Icone: Sparkles },
  { nome: "Infantil", Icone: Baby },
];

export default async function InicioPage() {
  const sessao = await auth();
  const primeiroNome = sessao?.user.nome.split(" ")[0] ?? "";
  const ehDono = sessao?.user.papel === "DONO_SALAO" || sessao?.user.papel === "ADMIN";

  // Lista mínima para alcançar o agendamento. A busca por nome e serviço, os
  // filtros e o mapa são as issues #10 e #11 — ainda não entraram.
  // RGN05: só salão publicado aparece.
  const saloes = await prisma.salao.findMany({
    where: { publicado: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, endereco: true, tipo: true },
    take: 12,
  });

  return (
    <>
      <header className="bg-brand-dark">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="mb-2 font-semibold text-white/70">Olá, {primeiroNome} 👋</p>
          <h1 className="max-w-2xl text-4xl font-black tracking-tight text-white md:text-5xl">
            Encontre o salão perfeito perto de você
          </h1>

          {/* Sprint 2: este campo passa a buscar salões por nome e serviço. */}
          <div className="mt-8 max-w-xl">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Buscar salão ou serviço"
                aria-label="Buscar salão ou serviço"
                aria-describedby="busca-indisponivel"
                className="h-12 border-transparent bg-card pl-9 disabled:cursor-not-allowed disabled:opacity-100"
                disabled
              />
            </div>
            <p id="busca-indisponivel" className="mt-2 text-sm text-white/70">
              A busca por salões chega na próxima entrega.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section aria-labelledby="categorias">
          <h2 id="categorias" className="mb-4 text-lg font-semibold">
            Categorias
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIAS.map(({ nome, Icone }) => (
              <li key={nome}>
                <Card className="p-4 text-center">
                  <Icone className="mx-auto mb-2 size-5 text-primary" aria-hidden />
                  <span className="text-sm font-medium">{nome}</span>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {ehDono && (
          <section aria-labelledby="meu-salao" className="mt-10">
            <h2 id="meu-salao" className="mb-4 text-lg font-semibold">
              Meu salão
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              <li>
                <Link href="/salao/meu/servicos" className="block">
                  <Card className="transition-colors hover:border-primary">
                    <CardContent className="flex items-center gap-3 p-5">
                      <Scissors className="size-5 text-primary" aria-hidden />
                      <div>
                        <p className="font-medium">Serviços</p>
                        <p className="text-sm text-muted-foreground">Cadastre nome, preço e duração.</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
              <li>
                <Link href="/salao/meu/horarios" className="block">
                  <Card className="transition-colors hover:border-primary">
                    <CardContent className="flex items-center gap-3 p-5">
                      <CalendarClock className="size-5 text-primary" aria-hidden />
                      <div>
                        <p className="font-medium">Horários</p>
                        <p className="text-sm text-muted-foreground">Defina quando o salão abre.</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            </ul>
          </section>
        )}

        <section aria-labelledby="proximos" className="mt-10">
          <h2 id="proximos" className="mb-4 text-lg font-semibold">
            Salões disponíveis
          </h2>

          {saloes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                <MapPin className="size-6 text-muted-foreground" aria-hidden />
                <p className="text-sm text-muted-foreground">
                  Nenhum salão publicado ainda. A busca por proximidade e o mapa chegam na próxima
                  entrega.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {saloes.map((salao) => (
                <li key={salao.id}>
                  <Link href={`/salao/${salao.id}/agendar`} className="block h-full">
                    <Card className="h-full transition-colors hover:border-primary">
                      <CardContent className="p-5">
                        <p className="font-medium">{salao.nome}</p>
                        {salao.tipo && <p className="mt-0.5 text-xs text-primary">{salao.tipo}</p>}
                        <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                          {salao.endereco}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
