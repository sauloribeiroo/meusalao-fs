import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buscarHorariosPorSalao, buscarSalaoPorDono } from "@/services/saloes/saloes.service";
import { FormularioHorarios } from "@/app/(app)/salao/meu/horarios/formulario-horarios";

export const metadata: Metadata = { title: "Horário de funcionamento | MeuSalão" };

const ROTULOS: Record<string, string> = {
  SEGUNDA: "Segunda",
  TERCA: "Terça",
  QUARTA: "Quarta",
  QUINTA: "Quinta",
  SEXTA: "Sexta",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

const ORDEM = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO", "DOMINGO"];

export default async function HorariosPage() {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");
  if (sessao.user.papel !== "DONO_SALAO") redirect("/inicio");

  const salao = await buscarSalaoPorDono(sessao.user.id);
  if (!salao) redirect("/salao/onboarding");

  const horarios = await buscarHorariosPorSalao(salao.id);
  const diasIniciais = ORDEM.map((chave) => {
    const horario = horarios.find((h) => h.diaSemana === chave);
    return {
      chave: chave as "SEGUNDA" | "TERCA" | "QUARTA" | "QUINTA" | "SEXTA" | "SABADO" | "DOMINGO",
      rotulo: ROTULOS[chave],
      horaAbertura: horario?.horaAbertura ?? "09:00",
      horaFechamento: horario?.horaFechamento ?? "18:00",
      ativo: horario?.ativo ?? false,
    };
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-black tracking-tight">Horário de funcionamento</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Defina os dias e horários em que o {salao.nome} atende. Isso é usado para calcular os horários disponíveis
        para agendamento.
      </p>

      <FormularioHorarios salaoId={salao.id} diasIniciais={diasIniciais} />
    </main>
  );
}
