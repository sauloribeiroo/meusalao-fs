import { CheckCircle2, ScissorsLineDashed, Sparkles } from "lucide-react";

/** Layout de /login e /cadastro: marca à esquerda, formulário à direita. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="relative flex flex-col items-center justify-center overflow-hidden bg-brand-dark p-8 md:p-14 text-center text-white md:min-h-dvh md:w-1/2">
        {/* Efeito sutil de iluminação de fundo preservando a cor da marca */}
        <div
          className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-white/5 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-black/25 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col items-center max-w-sm">
          {/* Novo símbolo moderno de tesoura */}
          <div className="mb-5 flex size-18 items-center justify-center rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 shadow-xl backdrop-blur-sm transition-transform duration-300 hover:scale-105">
            <ScissorsLineDashed className="size-9 text-white stroke-[1.8]" aria-hidden="true" />
          </div>

          {/* Badge moderna da plataforma */}
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wider uppercase text-white/80 ring-1 ring-white/15">
              <Sparkles className="size-3" aria-hidden="true" />
              Beleza & Bem-estar
            </span>
          </div>

          {/* Tipografia moderna e elegante para MeuSalão */}
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl text-white">
            Meu<span className="font-light tracking-wide text-white/80">Salão</span>
          </h1>

          <p className="mt-3 text-base font-normal leading-relaxed text-white/75">
            Agende serviços de beleza perto de você
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-2.5 text-xs text-white/85">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15 backdrop-blur-xs">
              <CheckCircle2 className="size-3.5 text-emerald-300" aria-hidden="true" />
              Agendamento 24h
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15 backdrop-blur-xs">
              <CheckCircle2 className="size-3.5 text-emerald-300" aria-hidden="true" />
              Salões verificados
            </span>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-purple-50/70 via-slate-50/60 to-purple-100/50 min-h-dvh md:w-1/2">
        <div className="w-full flex justify-center items-center">{children}</div>
      </main>
    </div>
  );
}
