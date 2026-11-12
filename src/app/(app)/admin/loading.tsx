import { CarregandoLista } from "@/components/carregando-lista";

/** Carregamento das abas da administração (resumo, usuários, salões, avaliações). */
export default function CarregandoAdmin() {
  return <CarregandoLista itens={5} />;
}
