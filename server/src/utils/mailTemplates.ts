const AZUL_PRIMARIO = '#0B4DB8';
const AZUL_OSCURO = '#172B4D';
const GRIS_TEXTO = '#53657D';
const GRIS_CLARO = '#F4F6F9';

function layout(tituloInterno: string, contenidoHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${tituloInterno}</title>
</head>
<body style="margin:0; padding:0; background:${GRIS_CLARO}; font-family:'Segoe UI', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${GRIS_CLARO}; padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; max-width:480px; width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg, #2433C9 0%, #0B2F6B 100%); padding:28px 32px;">
              <span style="color:#ffffff; font-size:18px; font-weight:700; letter-spacing:.2px;">Gestión Documental Hegewisch</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${contenidoHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px; background:${GRIS_CLARO}; text-align:center;">
              <span style="color:${GRIS_TEXTO}; font-size:11px;">© ${new Date().getFullYear()} Hegewisch López Consultores. Todos los derechos reservados.</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function plantillaRecuperacionPassword(nombre: string, resetUrl: string): { asunto: string; html: string } {
  const contenido = `
    <h1 style="margin:0 0 16px; font-size:20px; font-weight:800; color:${AZUL_OSCURO};">Restablece tu contraseña</h1>
    <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:${GRIS_TEXTO};">
      Hola ${nombre}, recibimos una solicitud para restablecer la contraseña de tu cuenta en el
      sistema de Gestión Documental. Si no fuiste tú, puedes ignorar este correo con tranquilidad.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="border-radius:8px; background:${AZUL_PRIMARIO};">
          <a href="${resetUrl}" target="_blank"
             style="display:inline-block; padding:13px 28px; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none;">
            Restablecer contraseña
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px; font-size:12px; color:${GRIS_TEXTO};">
      Si el botón no funciona, copia y pega este enlace en tu navegador:
    </p>
    <p style="margin:0 0 20px; font-size:12px; word-break:break-all;">
      <a href="${resetUrl}" style="color:${AZUL_PRIMARIO};">${resetUrl}</a>
    </p>
    <p style="margin:0; font-size:12px; color:${GRIS_TEXTO};">
      Este enlace es válido durante las próximas 2 horas por tu seguridad.
    </p>
  `;
  return {
    asunto: 'Restablece tu contraseña - Gestión Documental Hegewisch',
    html: layout('Restablece tu contraseña', contenido),
  };
}

export function plantillaAlertaFielVencimiento(params: {
  nombreTitular: string;
  diasRestantes: number;
  fechaVencimiento: string;
}): { asunto: string; html: string } {
  const { nombreTitular, diasRestantes, fechaVencimiento } = params;
  const textoDias = diasRestantes === 0
    ? 'vence <strong>hoy</strong>'
    : `vence en <strong>${diasRestantes} día${diasRestantes === 1 ? '' : 's'}</strong>`;

  const contenido = `
    <h1 style="margin:0 0 16px; font-size:20px; font-weight:800; color:${AZUL_OSCURO};">Tu FIEL está por vencer</h1>
    <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:${GRIS_TEXTO};">
      Hola ${nombreTitular}, te informamos que tu Firma Electrónica Avanzada (FIEL) ${textoDias},
      con fecha límite el <strong>${fechaVencimiento}</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF4E5; border-radius:8px; margin:0 0 20px;">
      <tr>
        <td style="padding:16px 18px;">
          <p style="margin:0; font-size:13px; color:#8A5A00; line-height:1.6;">
            Te recomendamos iniciar cuanto antes el proceso de renovación ante el SAT y cargar tu
            nueva FIEL en el sistema para evitar interrupciones en tus trámites fiscales.
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:0; font-size:12px; color:${GRIS_TEXTO};">
      Si ya renovaste tu FIEL, ingresa al sistema y actualiza el documento para dejar de recibir este aviso.
    </p>
  `;
  return {
    asunto: `Tu FIEL ${diasRestantes === 0 ? 'vence hoy' : `vence en ${diasRestantes} día${diasRestantes === 1 ? '' : 's'}`} - Gestión Documental Hegewisch`,
    html: layout('Alerta de vencimiento de FIEL', contenido),
  };
}
