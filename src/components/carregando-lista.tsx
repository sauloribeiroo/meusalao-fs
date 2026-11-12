/**
 * Esqueleto de uma lista de cartões, mostrado pelos `loading.tsx` enquanto a
 * página busca os dados no servidor. Evita a tela parada sem resposta ao
 * trocar de aba.
 */
export function CarregandoLista({ itens = 4 }: { itens?: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Carregando...</span>

      <div className="flex gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-muted" />
        ))}
      </div>

      <ul className="space-y-3" aria-hidden>
        {Array.from({ length: itens }, (_, i) => (
          <li key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-muted" />
          </li>
        ))}
      </ul>
    </div>
  );
}
