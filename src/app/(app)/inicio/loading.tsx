import { SalonCardSkeleton } from "./salon-card-skeleton";

/** Carregamento do início: a grade de salões em esqueleto, no mesmo recorte. */
export default function CarregandoInicio() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {Array.from({ length: 6 }).map((_, indice) => (
          <li key={indice}>
            <SalonCardSkeleton />
          </li>
        ))}
      </ul>
    </main>
  );
}
