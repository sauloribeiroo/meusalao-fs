import { Scissors } from "lucide-react";

/** Layout de /login e /cadastro: marca à esquerda, formulário à direita. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex flex-col items-center justify-center gap-4 bg-brand-dark p-10 text-center text-white md:min-h-dvh md:w-1/2">
        <Scissors className="size-8 text-white/70" aria-hidden />
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">MeuSalão</h1>
        <p className="max-w-xs text-white/70">Descubra e agende serviços de beleza perto de você</p>
      </aside>

      <main className="flex flex-1 items-center justify-center p-6 md:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
