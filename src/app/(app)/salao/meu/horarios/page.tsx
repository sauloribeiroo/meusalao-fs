import type { Metadata } from "next";
import { auth } from "@/auth";
import { FormularioHorarios } from "@/app/(app)/salao/meu/horarios/formulario-horarios";
import { SemSalao } from "@/components/sem-salao";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listarHorariosDoSalao } from "@/services/horarios/horarios.service";
import { salaoDoDono } from "@/services/saloes/saloes.service";

export const metadata: Metadata = { title: "Horários | MeuSalão" };

/** RF22 — configuração dos horários de funcionamento. */
export default async function HorariosPage() {
  const sessao = await auth();
  const salao = await salaoDoDono(sessao!.user.id);

  if (!salao) return <SemSalao />;

  const horarios = await listarHorariosDoSalao(salao.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horário de funcionamento</CardTitle>
        <CardDescription>
          Marque os dias em que o salão abre e informe a abertura e o fechamento. Os clientes só
          conseguem agendar dentro dessa janela.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormularioHorarios horarios={horarios} />
      </CardContent>
    </Card>
  );
}
