import type { Metadata } from "next";
import { ExploradorDeSaloes } from "@/app/(app)/saloes/explorador";
import { listarSaloesPublicados, tiposDeSalao } from "@/services/saloes/saloes.service";

export const metadata: Metadata = { title: "Salões | MeuSalão" };

/**
 * RF09, RF10 e RF11 — salões em lista ou no mapa, com busca e filtros.
 *
 * A primeira carga vem do servidor, sem localização: a tela já aparece cheia e,
 * se o usuário conceder a permissão, o cliente refaz a busca ordenada por
 * proximidade. Negar a permissão não tira nada da tela (RNF08).
 *
 * `termo` na URL já chega aplicado, para a busca do início levar direto ao
 * resultado — e para o link do resultado poder ser compartilhado.
 */
export default async function SaloesPage({
  searchParams,
}: {
  searchParams: Promise<{ termo?: string }>;
}) {
  const { termo } = await searchParams;

  const [saloes, tipos] = await Promise.all([
    listarSaloesPublicados(null, { termo }),
    tiposDeSalao(),
  ]);

  return (
    <>
      <header className="bg-brand-dark">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <h1 className="text-3xl font-black tracking-tight text-white">Salões disponíveis</h1>
          <p className="mt-1 text-white/70">
            Veja quem está perto de você e agende sem precisar ligar.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <ExploradorDeSaloes iniciais={saloes} tipos={tipos} termoInicial={termo} />
      </main>
    </>
  );
}
