import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';
import { plantillaAlertaFielVencimiento, plantillaRecuperacionPassword } from '../utils/mailTemplates';

let transporter: Transporter | null = null;
let avisoConfigFaltanteMostrado = false;

function obtenerTransporter(): Transporter | null {
  if (!env.mail.host || !env.mail.user || !env.mail.pass) {
    if (!avisoConfigFaltanteMostrado) {
      console.warn('SMTP no configurado (SMTP_HOST/SMTP_USER/SMTP_PASS): los correos no se enviaran.');
      avisoConfigFaltanteMostrado = true;
    }
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.secure,
      auth: { user: env.mail.user, pass: env.mail.pass },
    });
  }

  return transporter;
}

async function enviar(destinatario: string, asunto: string, html: string): Promise<void> {
  const cliente = obtenerTransporter();
  if (!cliente) return;

  await cliente.sendMail({
    from: env.mail.from,
    to: destinatario,
    subject: asunto,
    html,
  });
}

export async function enviarCorreoRecuperacionPassword(
  destinatario: string,
  nombre: string,
  resetUrl: string,
): Promise<void> {
  const { asunto, html } = plantillaRecuperacionPassword(nombre, resetUrl);
  await enviar(destinatario, asunto, html);
}

export async function enviarCorreoAlertaFielVencimiento(
  destinatario: string,
  params: { nombreTitular: string; diasRestantes: number; fechaVencimiento: string },
): Promise<void> {
  const { asunto, html } = plantillaAlertaFielVencimiento(params);
  await enviar(destinatario, asunto, html);
}
