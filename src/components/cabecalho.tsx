import Link from "next/link";
import { CalendarDays, LogOut, Scissors, ShieldCheck, UserRound } from "lucide-react";
import { sairAction } from "@/acoes/sessao";
import { Button, buttonVariants } from "@/components/ui/button";

export function Cabecalho({ nome, papel }: { nome: string; papel?: string }) {
  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
        <Link href="/inicio" className="flex items-center gap-2 font-black tracking-tight">
          <Scissors className="size-5 text-primary" aria-hidden />
          MeuSalão
        </Link>

        <div className="flex items-center gap-1">
          {papel === "ADMIN" && (
            <Link
              href="/admin"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              aria-label="Administração"
            >
              <ShieldCheck aria-hidden />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          <Link
            href="/agendamentos"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            aria-label="Meus agendamentos"
          >
            <CalendarDays aria-hidden />
            <span className="hidden sm:inline">Agendamentos</span>
          </Link>
          <Link
            href="/perfil"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            aria-label="Meus dados"
          >
            <UserRound aria-hidden />
            <span className="hidden sm:inline">{nome}</span>
          </Link>
          <form action={sairAction}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut aria-hidden />
              Sair
            </Button>
          </form>
        </div>
      </div>
    </nav>
  );
}
