import type { Metadata } from "next";
import { Baby, Brush, MapPin, Scissors, Search, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Início | MeuSalão" };

// Sprint 2+: as categorias virão do banco, junto com a busca de salões.
const CATEGORIAS = [
  { nome: "Corte", Icone: Scissors },
  { nome: "Coloração", Icone: Brush },
  { nome: "Manicure", Icone: Sparkles },
  { nome: "Barba", Icone: Scissors },
  { nome: "Estética", Icone: Sparkles },
  { nome: "Infantil", Icone: Baby },
];

export default async function InicioPage() {
  const sessao = await auth();
  const primeiroNome = sessao?.user.nome.split(" ")[0] ?? "";

  return (
    <>
      <header className="bg-brand-dark">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="mb-2 font-semibold text-white/70">Olá, {primeiroNome} 👋</p>
          <h1 className="max-w-2xl text-4xl font-black tracking-tight text-white md:text-5xl">
            Encontre o salão perfeito perto de você
          </h1>

          {/* Sprint 2: este campo passa a buscar salões por nome e serviço. */}
          <div className="relative mt-8 max-w-xl">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              placeholder="Buscar salão ou serviço"
              aria-label="Buscar salão ou serviço"
              className="h-12 pl-9"
              disabled
            />
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

        <section aria-labelledby="proximos" className="mt-10">
          <h2 id="proximos" className="mb-4 text-lg font-semibold">
            Salões próximos
          </h2>
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
              <MapPin className="size-6 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Em breve: salões próximos a você, com preços e avaliações.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
