/**
 * Envio de e-mail transacional.
 *
 * O MVP não tem provedor contratado, e o PRD (seção 2.7) registra isso como
 * dependência externa. Enquanto não houver um, a mensagem é escrita no log do
 * servidor — o fluxo de recuperação de senha funciona ponta a ponta em
 * desenvolvimento, e o link aparece no terminal.
 *
 * Para passar a enviar de verdade (Resend, SendGrid, SMTP), basta trocar o
 * corpo desta função: nada mais no projeto conhece o provedor.
 */

export type Email = {
  para: string;
  assunto: string;
  texto: string;
};

export async function enviarEmail({ para, assunto, texto }: Email): Promise<void> {
  console.info(
    ["", "──────── E-MAIL (modo desenvolvimento) ────────", `Para:    ${para}`, `Assunto: ${assunto}`, "", texto, "───────────────────────────────────────────────", ""].join(
      "\n",
    ),
  );
}

/** Indica se há provedor configurado — a UI avisa o usuário quando não há. */
export const envioDeEmailAtivo = false;
