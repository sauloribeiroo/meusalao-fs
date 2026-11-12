import { CarregandoLista } from "@/components/carregando-lista";

/** Carregamento da busca de salões (e da comparação, que fica abaixo dela). */
export default function CarregandoSaloes() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <CarregandoLista itens={6} />
    </main>
  );
}
