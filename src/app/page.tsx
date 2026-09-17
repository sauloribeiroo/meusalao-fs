import { redirect } from "next/navigation";
import { auth } from "@/auth";

// A raiz leva para o início quando há sessão, e para o login quando não há.
export default async function Home() {
  const sessao = await auth();
  redirect(sessao?.user ? "/inicio" : "/login");
}
