import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CampoProps = React.ComponentProps<"input"> & {
  label: string;
  /** Primeira mensagem de erro do campo, vinda da validação no servidor. */
  erro?: string;
};

/** Label + input + mensagem de erro, ligados por id para acessibilidade. */
export function Campo({ label, erro, id, name, ...props }: CampoProps) {
  const campoId = id ?? name;
  const erroId = `${campoId}-erro`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={campoId}>{label}</Label>
      <Input
        id={campoId}
        name={name}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? erroId : undefined}
        {...props}
      />
      {erro && (
        <p id={erroId} className="text-xs text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
