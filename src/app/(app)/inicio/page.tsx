import type { Metadata } from "next";
import Link from "next/link";
import {
  Baby,
  CalendarCheck,
  CalendarClock,
  Clock,
  Hand,
  LayoutDashboard,
  MapPin,
  MapPinned,
  Paintbrush,
  Scissors,
  Search,
  Sparkles,
  SprayCan,
  Star,
  Store,
} from "lucide-react";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { salaoDoDono } from "@/services/saloes/saloes.service";
import { EmptyState } from "./empty-state";
import { SalonCard } from "./salon-card";

export const metadata: Metadata = { title: "Início | MeuSalão" };

// As categorias são buscas prontas: cada uma leva a /saloes com o termo.
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

  // A gestão aparece para quem TEM salão, não para quem tem o papel: o
  // administrador carrega papel de dono em toda checagem (RGN07) mas em geral
  // não tem salão nenhum, e os quatro atalhos levavam todos a "Nenhum salão
  // cadastrado". Vale também para o dono cujo salão foi removido.
  const salaoDoUsuario = sessao?.user.id ? await salaoDoDono(sessao.user.id) : null;
  const ehDono = salaoDoUsuario !== null;

  // RGN05: só salão publicado aparece.
  const saloes = await prisma.salao.findMany({
    where: { publicado: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, endereco: true, tipo: true },
    take: 12,
  });

  return (
    <>
      <header className="w-full bg-brand-dark">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-16 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <p className="mb-2.5 text-base font-semibold text-white/85">
                Olá, {primeiroNome} 👋
              </p>
              <h1 className="max-w-[560px] text-4xl font-black tracking-tight text-white sm:text-5xl md:leading-tight">
                Encontre o salão perfeito perto de você
              </h1>

              {/* RF09 — busca por GET: o termo vai na URL de /saloes, então o
                  resultado é compartilhável e não exige estado no cliente. */}
              <form action="/saloes" className="mt-8 max-w-[560px]">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    type="search"
                    name="termo"
                    placeholder="Buscar salão ou serviço"
                    aria-label="Buscar salão ou serviço"
                    className="h-14 w-full rounded-2xl border-0 bg-card pl-12 pr-28 text-base shadow-lg shadow-black/10 placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-white/40"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-95"
                  >
                    Buscar
                  </button>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-1" aria-hidden="true">
              <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Salões perto de você</p>
                  <p className="text-xs text-white/80">Explore profissionais da sua região</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                  <Clock className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Agende em 1 minuto</p>
                  <p className="text-xs text-white/80">Escolha o serviço e o melhor horário</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                  <Star className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Avaliações reais</p>
                  <p className="text-xs text-white/80">Notas de clientes que já foram ao salão</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section aria-labelledby="categorias">
          <h2 id="categorias" className="mb-4 text-lg font-bold tracking-tight text-foreground">
            Categorias
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIAS.map(({ nome, Icone }) => (
              <li key={nome}>
                {/* Cada categoria é uma busca pronta pelo nome do serviço. */}
                <Link href={`/saloes?termo=${encodeURIComponent(nome)}`} className="group block h-full">
                  <Card className="flex h-full flex-col items-center justify-center rounded-[16px] p-4 text-center transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
                    <div className="mb-2.5 flex size-12 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/15">
                      <Icone className="size-5 text-primary transition-transform duration-200 group-hover:scale-110" aria-hidden />
                    </div>
                    <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                      {nome}
                    </span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {ehDono && (
          <section aria-labelledby="meu-salao" className="mt-10">
            <h2 id="meu-salao" className="mb-4 text-lg font-bold tracking-tight text-foreground">
              Meu salão
            </h2>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <li>
                <Link href="/salao/meu/painel" className="group block">
                  <Card className="rounded-[16px] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
                    <CardContent className="flex items-center gap-3.5 p-5">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <LayoutDashboard className="size-5" aria-hidden />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground transition-colors group-hover:text-primary">Painel</p>
                        <p className="text-sm text-muted-foreground">Métricas e agenda do dia.</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
              <li>
                <Link href="/salao/meu/agenda" className="group block">
                  <Card className="rounded-[16px] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
                    <CardContent className="flex items-center gap-3.5 p-5">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <CalendarCheck className="size-5" aria-hidden />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground transition-colors group-hover:text-primary">Agenda</p>
                        <p className="text-sm text-muted-foreground">Confirme ou recuse pedidos.</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
              <li>
                <Link href="/salao/meu/servicos" className="group block">
                  <Card className="rounded-[16px] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
                    <CardContent className="flex items-center gap-3.5 p-5">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Scissors className="size-5" aria-hidden />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground transition-colors group-hover:text-primary">Serviços</p>
                        <p className="text-sm text-muted-foreground">Cadastre nome, preço e duração.</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
              <li>
                <Link href="/salao/meu/horarios" className="group block">
                  <Card className="rounded-[16px] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
                    <CardContent className="flex items-center gap-3.5 p-5">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <CalendarClock className="size-5" aria-hidden />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground transition-colors group-hover:text-primary">Horários</p>
                        <p className="text-sm text-muted-foreground">Defina quando o salão abre.</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            </ul>
          </section>
        )}

        {!ehDono && (
          <section aria-labelledby="tem-salao" className="mt-10">
            <h2 id="tem-salao" className="sr-only">
              Tem um salão?
            </h2>
            <Card className="rounded-[16px] shadow-xs">
              <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-foreground">Você tem um salão?</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    Cadastre o seu e comece a receber agendamentos pelo MeuSalão.
                  </p>
                </div>
                <Link
                  href="/salao/novo"
                  className={buttonVariants({
                    size: "default",
                    className: "h-10 shrink-0 rounded-xl px-5 font-semibold shadow-xs transition-all duration-150 active:scale-95",
                  })}
                >
                  <Store className="size-4" aria-hidden />
                  Cadastrar salão
                </Link>
              </CardContent>
            </Card>
          </section>
        )}

        <section aria-labelledby="proximos" className="mt-10">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 id="proximos" className="text-lg font-bold tracking-tight text-foreground">
              Salões disponíveis
            </h2>
            {/* O mapa de verdade é o de /saloes: todos os salões, a posição de
                quem está olhando e o link de cada um (RF10, RF11). */}
            <Link
              href="/saloes"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "h-9 rounded-xl px-3.5 text-xs font-semibold shadow-xs transition-colors hover:border-gray-300",
              })}
            >
              <MapPinned className="size-4" aria-hidden />
              Ver no mapa
            </Link>
          </div>

          {saloes.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {saloes.map((salao) => (
                <li key={salao.id} className="min-w-0">
                  <SalonCard salao={salao} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
