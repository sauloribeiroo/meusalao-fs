import type { StatusAgendamento } from "@prisma/client";

/**
 * RF26 — agendamentos por status, em barras horizontais.
 *
 * Barras em HTML, não em SVG nem em biblioteca de gráficos: são quatro
 * categorias e uma medida, e `div` com largura percentual desenha isso sem
 * acrescentar dependência nem script ao pacote.
 *
 * As cores são as mesmas que a agenda do salão já usa para cada status, então
 * quem administra reconhece sem precisar de legenda. A paleta foi verificada
 * para daltonismo: o par mais próximo (verde e âmbar) fica na faixa que só é
 * aceitável com rótulo direto — por isso cada barra traz nome e número escritos,
 * e a cor nunca é a única informação.
 */

const ORDEM: { status: StatusAgendamento; rotulo: string; cor: string }[] = [
  { status: "PENDENTE", rotulo: "Aguardando confirmação", cor: "#d97706" },
  { status: "CONFIRMADO", rotulo: "Confirmados", cor: "#059669" },
  { status: "CONCLUIDO", rotulo: "Concluídos", cor: "#7c3aed" },
  { status: "CANCELADO", rotulo: "Cancelados", cor: "#dc2626" },
];

export function AgendamentosPorStatus({ dados }: { dados: Record<StatusAgendamento, number> }) {
  const total = ORDEM.reduce((soma, { status }) => soma + (dados[status] ?? 0), 0);

  if (total === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nenhum agendamento registrado ainda.
      </p>
    );
  }

  // Escala pelo maior valor, não pelo total: com 1 cancelado e 40 concluídos,
  // escalar pelo total deixaria a primeira barra invisível.
  const maior = Math.max(...ORDEM.map(({ status }) => dados[status] ?? 0));

  return (
    <ul className="space-y-3">
      {ORDEM.map(({ status, rotulo, cor }) => {
        const valor = dados[status] ?? 0;
        const fatia = Math.round((valor / total) * 100);

        return (
          <li key={status}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-muted-foreground">{rotulo}</span>
              <span className="shrink-0 font-semibold tabular-nums">
                {valor}
                <span className="ml-1.5 font-normal text-muted-foreground">{fatia}%</span>
              </span>
            </div>

            {/* O trilho dá a referência da escala sem precisar de eixo. */}
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={`${rotulo}: ${valor} de ${total} agendamentos (${fatia}%)`}
              title={`${rotulo}: ${valor} (${fatia}%)`}
            >
              <div
                className="h-full rounded-full transition-all"
                // Barra zerada fica sem largura de propósito: um traço mínimo
                // sugeriria que existe algum agendamento naquele status.
                style={{ width: maior === 0 ? 0 : `${(valor / maior) * 100}%`, backgroundColor: cor }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
