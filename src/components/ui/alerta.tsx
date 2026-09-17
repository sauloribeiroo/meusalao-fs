import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Mensagem de erro de formulário, anunciada por leitores de tela. */
function AlertaErro({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export { AlertaErro };
