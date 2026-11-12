import { CarregandoLista } from "@/components/carregando-lista";

/** Carregamento de "Meus agendamentos" (e da tela de avaliar, que fica abaixo dela). */
export default function CarregandoAgendamentos() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <CarregandoLista />
    </main>
  );
}
