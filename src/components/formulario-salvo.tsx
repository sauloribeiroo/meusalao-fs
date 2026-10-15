"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

/**
 * Confirmação de salvamento que some sozinha.
 *
 * Recebe o instante do salvamento, não um booleano: com `true` fixo, o valor
 * não mudaria entre dois salvamentos seguidos e a mensagem só apareceria uma vez.
 *
 * `role="status"` em vez de `role="alert"`: é informação, não interrupção — o
 * leitor de tela anuncia sem cortar o que estiver lendo.
 */
export function FormularioSalvo({ salvoEm, texto = "Alterações salvas" }: { salvoEm?: number; texto?: string }) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (!salvoEm) return;

    setVisivel(true);
    const tempo = setTimeout(() => setVisivel(false), 4000);
    return () => clearTimeout(tempo);
  }, [salvoEm]);

  return (
    <p role="status" className="flex min-h-5 items-center gap-1.5 text-sm text-emerald-700">
      {visivel && (
        <>
          <Check className="size-4" aria-hidden />
          {texto}
        </>
      )}
    </p>
  );
}
