import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({ onLimparBusca }: { onLimparBusca?: () => void }) {
  return (
    <Card className="rounded-2xl border-border bg-card shadow-xs">
      <CardContent className="flex flex-col items-center px-6 py-12 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Search className="size-7" aria-label="Nenhum salão encontrado" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Nenhum salão encontrado</h3>
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          Tente outra categoria ou ajuste sua busca
        </p>

        {onLimparBusca && (
          <button
            type="button"
            onClick={onLimparBusca}
            className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors duration-150 hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Limpar busca
          </button>
        )}
      </CardContent>
    </Card>
  );
}
