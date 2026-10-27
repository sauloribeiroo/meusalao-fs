/**
 * Envio de e-mail transacional.
 *
 * O provedor é o Resend, chamado pela API HTTP com `fetch` — não há SDK
 * instalado de propósito: a chamada é um POST com três campos, e uma dependência
 * a mais só para isso não se paga.
 *
 * Sem `RESEND_API_KEY` configurada, a mensagem volta a ser escrita no log do
 * servidor. É o que mantém o fluxo de recuperação de senha testável em
 * desenvolvimento, sem exigir conta em serviço externo de quem clonar o projeto.
 *
 * Nada mais no projeto conhece o provedor: quem chama só sabe `enviarEmail`.
 */

const CHAVE = process.env.RESEND_API_KEY;

/**
 * Remetente. Sem domínio próprio verificado no Resend, o endereço precisa ser o
 * `onboarding@resend.dev`, e nesse modo a entrega só acontece para o e-mail dono
 * da conta — suficiente para demonstrar, não para uso real.
 */
const REMETENTE = process.env.EMAIL_REMETENTE ?? "MeuSalao <onboarding@resend.dev>";

/** Indica se há provedor configurado — a UI avisa o usuário quando não há. */
export const envioDeEmailAtivo = Boolean(CHAVE);

export type Email = {
  para: string;
  assunto: string;
  texto: string;
};

export async function enviarEmail({ para, assunto, texto }: Email): Promise<void> {
  if (!CHAVE) {
    registrarNoLog({ para, assunto, texto });
    return;
  }

  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${CHAVE}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: REMETENTE, to: [para], subject: assunto, text: texto }),
    });

    if (!resposta.ok) {
      console.error(`Falha ao enviar e-mail (HTTP ${resposta.status}):`, await resposta.text());
    }
  } catch (erro) {
    console.error("Falha ao enviar e-mail:", erro);
  }
}

/**
 * A falha de envio é registrada, nunca propagada. Se ela virasse exceção, a tela
 * de recuperação responderia diferente para e-mail existente e inexistente — e
 * voltaria a ser um verificador de quem tem conta, que é justamente o que o
 * fluxo evita.
 */
function registrarNoLog({ para, assunto, texto }: Email): void {
  console.info(
    [
      "",
      "──────── E-MAIL (modo desenvolvimento) ────────",
      `Para:    ${para}`,
      `Assunto: ${assunto}`,
      "",
      texto,
      "───────────────────────────────────────────────",
      "",
    ].join("\n"),
  );
}
