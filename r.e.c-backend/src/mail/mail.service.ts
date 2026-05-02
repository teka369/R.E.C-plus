import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY no está definida – los emails no se enviarán',
      );
    }
    this.resend = new Resend(apiKey || 're_dummy_no_send');
    this.from = process.env.RESEND_FROM ?? 'R.E.C <noreply@recedu.co>';
  }

  async sendPasswordReset(
    to: string,
    resetPageUrl: string,
    token: string,
    appResetDeepLink?: string,
  ): Promise<void> {
    const appBlock =
      appResetDeepLink && appResetDeepLink.trim()
        ? `
            <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6;">
              <strong>App móvil R.E.C:</strong> si tienes la app instalada, puedes abrir el restablecimiento directamente:
            </p>
            <a href="${appResetDeepLink}" style="display: inline-block; margin: 16px 0 24px; padding: 12px 28px; background-color: #1e5c3a; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
              Abrir en la app
            </a>
          `
        : '';
    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject: 'Restablecer contraseña – R.E.C',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 16px;">Restablecer contraseña</h2>
            <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta en R.E.C.
              Si no fuiste tú, puedes ignorar este correo.
            </p>
            <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6;">
              Abre la página de restablecimiento y pega el <strong>token de recuperación</strong> que aparece abajo (no lo compartas con nadie).
            </p>
            ${appBlock}
            <a href="${resetPageUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 28px; background-color: #2f8a57; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
              Ir a restablecer contraseña (web)
            </a>
            <p style="color: #888; font-size: 12px; line-height: 1.5;">
              Este token expira en 1 hora. Cópialo completo en el campo «Token de recuperación»:
            </p>
            <p style="color: #1a1a1a; font-size: 13px; font-family: ui-monospace, monospace; word-break: break-all; background: #f4f4f4; padding: 12px; border-radius: 8px;">${token}</p>
            <p style="color: #888; font-size: 12px; line-height: 1.5;">
              Si el botón no funciona, abre manualmente: <span style="word-break: break-all;">${resetPageUrl}</span>
            </p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error('Error enviando email de reset', error);
      throw error;
    }
  }
}
