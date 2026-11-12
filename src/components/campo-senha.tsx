"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CampoSenhaProps = Omit<React.ComponentProps<"input">, "type"> & {
  label: string;
  /** Primeira mensagem de erro do campo, vinda da validação no servidor. */
  erro?: string;
};

/** Igual ao `Campo`, mas com um botão para mostrar ou ocultar a senha digitada. */
export function CampoSenha({ label, erro, id, name, ...props }: CampoSenhaProps) {
  const [visivel, setVisivel] = useState(false);
  const campoId = id ?? name;
  const erroId = `${campoId}-erro`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={campoId}>{label}</Label>
      <div className="relative">
        <Input
          id={campoId}
          name={name}
          type={visivel ? "text" : "password"}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? erroId : undefined}
          className="pr-11"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? "Ocultar senha" : "Ver senha"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visivel ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
      {erro && (
        <p id={erroId} className="text-xs text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
