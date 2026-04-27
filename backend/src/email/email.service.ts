import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend | null = null;
  private readonly logger = new Logger(EmailService.name);
  private readonly isConfigured: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.isConfigured = !!apiKey;

    if (this.isConfigured) {
      this.resend = new Resend(apiKey);
      this.logger.log('✅ Resend email service initialized');
      this.logger.log(`📧 Configured with FROM: ${this.getFromEmail()}`);
    } else {
      this.logger.warn('⚠️ RESEND_API_KEY not configured - emails will be logged to console');
    }
  }

  private getBaseUrl(): string {
    return this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  }

  private getFromEmail(): string {
    return this.configService.get<string>('EMAIL_FROM') || 'onboarding@resend.dev';
  }

  /**
   * Core send email method using Resend
   */
  private async sendEmail(options: { to: string; subject: string; html: string }): Promise<void> {
    if (!this.isConfigured || !this.resend) {
      this.logger.log(`📧 [DEV] Email to: ${options.to}`);
      this.logger.log(`📧 [DEV] Subject: ${options.subject}`);
      return;
    }

    try {
      this.logger.log(`Attempting to send email to ${options.to} from ${this.getFromEmail()}`);
      const result = await this.resend.emails.send({
        from: this.getFromEmail(),
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (result.error) {
        this.logger.error(`❌ Resend API Error: ${JSON.stringify(result.error)}`);
      } else {
        this.logger.log(`✅ Email sent successfully to ${options.to}. ID: ${result.data?.id}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${options.to}`, error);
      if (error.response) {
        this.logger.error(`Resend Response Data: ${JSON.stringify(error.response.data)}`);
      }
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(to: string, resetToken: string, userName: string): Promise<void> {
    const resetUrl = `${this.getBaseUrl()}/reset-password/${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #312e81, #1e1b4b); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .content p { color: #4a5568; line-height: 1.6; margin: 0 0 15px; }
          .button { display: inline-block; background: #312e81; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
          .warning { background: #fef3cd; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; font-size: 14px; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperação de Senha</h1>
          </div>
          <div class="content">
            <p>Olá, <strong>${userName}</strong>!</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <a href="${resetUrl}" class="button">Redefinir Minha Senha</a>
            <div class="warning">
              ⚠️ Este link expira em <strong>1 hora</strong>. Se você não solicitou esta alteração, ignore este e-mail.
            </div>
            <p style="font-size: 12px; color: #94a3b8;">Se o botão não funcionar, copie e cole este link no navegador:<br>${resetUrl}</p>
          </div>
          <div class="footer">
            Advus - Gestão Jurídica Inteligente<br>
            Este é um e-mail automático, não responda.
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: '🔐 Redefinição de Senha - Advus',
      html,
    });
  }

  /**
   * Send login alert for new device/IP
   */
  async sendLoginAlert(
    to: string,
    userName: string,
    details: { ip: string; userAgent: string; location?: string }
  ): Promise<void> {
    const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .content p { color: #4a5568; line-height: 1.6; margin: 0 0 15px; }
          .info-box { background: #f8fafc; border-radius: 8px; padding: 15px; margin: 15px 0; }
          .warning { background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 15px 0; font-size: 14px; color: #b91c1c; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Novo Login Detectado</h1>
          </div>
          <div class="content">
            <p>Olá, <strong>${userName}</strong>!</p>
            <p>Detectamos um novo login na sua conta.</p>
            <div class="info-box">
              <p><strong>📅 Data/Hora:</strong> ${now}</p>
              <p><strong>🌐 IP:</strong> ${details.ip || 'Não disponível'}</p>
              <p><strong>💻 Dispositivo:</strong> ${this.parseUserAgent(details.userAgent)}</p>
            </div>
            <div class="warning">
              ⚠️ Se você não reconhece este login, altere sua senha imediatamente.
            </div>
          </div>
          <div class="footer">
            Advus - Gestão Jurídica Inteligente
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: '🔔 Novo Login Detectado - Advus',
      html,
    });
  }

  /**
   * Send general notification email
   */
  async sendNotification(
    to: string,
    userName: string,
    options: { title: string; message: string; actionUrl?: string; actionLabel?: string }
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .content p { color: #4a5568; line-height: 1.6; margin: 0 0 15px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 ${options.title}</h1>
          </div>
          <div class="content">
            <p>Olá, <strong>${userName}</strong>!</p>
            <p>${options.message}</p>
            ${options.actionUrl ? `<a href="${options.actionUrl}" class="button">${options.actionLabel || 'Ver Detalhes'}</a>` : ''}
          </div>
          <div class="footer">
            Advus - Gestão Jurídica Inteligente
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: `📬 ${options.title}`,
      html,
    });
  }

  /**
   * Send deadline reminder email
   */
  async sendDeadlineReminder(
    to: string,
    userName: string,
    deadline: { title: string; date: string; processNumber?: string }
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .content p { color: #4a5568; line-height: 1.6; margin: 0 0 15px; }
          .deadline-box { background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .deadline-date { font-size: 24px; font-weight: bold; color: #dc2626; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Lembrete de Prazo</h1>
          </div>
          <div class="content">
            <p>Olá, <strong>${userName}</strong>!</p>
            <p>Este é um lembrete sobre um prazo importante:</p>
            <div class="deadline-box">
              <div class="deadline-date">📅 ${deadline.date}</div>
              <div style="margin-top: 8px; font-size: 16px;">${deadline.title}</div>
              ${deadline.processNumber ? `<div style="margin-top: 8px; font-size: 14px; color: #6b7280;">Processo: ${deadline.processNumber}</div>` : ''}
            </div>
            <a href="${this.getBaseUrl()}/agenda" class="button">Ver Agenda</a>
          </div>
          <div class="footer">
            Advus - Gestão Jurídica Inteligente
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: `⏰ Lembrete: ${deadline.title}`,
      html,
    });
  }

  /**
   * Send process update notification
   */
  async sendProcessUpdate(
    to: string,
    userName: string,
    update: { processNumber: string; processTitle: string; updateDescription: string }
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .content p { color: #4a5568; line-height: 1.6; margin: 0 0 15px; }
          .update-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Atualização de Processo</h1>
          </div>
          <div class="content">
            <p>Olá, <strong>${userName}</strong>!</p>
            <p>Há uma nova movimentação no seu processo:</p>
            <div class="update-box">
              <div style="font-weight: bold; color: #065f46; font-size: 14px;">Processo: ${update.processNumber}</div>
              <div style="color: #1e293b; font-size: 16px; margin: 5px 0 10px;">${update.processTitle}</div>
              <div style="color: #4a5568; font-size: 14px;">${update.updateDescription}</div>
            </div>
            <a href="${this.getBaseUrl()}/processos" class="button">Ver Processo</a>
          </div>
          <div class="footer">
            Advus - Gestão Jurídica Inteligente
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: `📋 Atualização: ${update.processNumber} - ${update.processTitle}`,
      html,
    });
  }

  /**
   * Send welcome email with login credentials to new user
   */
  async sendWelcomeEmail(
    to: string,
    userName: string,
    tempPassword: string,
    invitedBy?: string,
  ): Promise<void> {
    const loginUrl = `${this.getBaseUrl()}/login`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .content p { color: #4a5568; line-height: 1.6; margin: 0 0 15px; }
          .credentials-box { background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .credential-row { margin: 10px 0; }
          .credential-label { color: #166534; font-weight: 600; }
          .credential-value { color: #1e293b; background: white; padding: 8px 12px; border-radius: 6px; font-family: monospace; border: 1px solid #d1d5db; display: inline-block; margin-top: 4px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .warning { background: #fef3cd; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; font-size: 14px; color: #92400e; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bem-vindo ao Advus!</h1>
          </div>
          <div class="content">
            <p>Olá, <strong>${userName}</strong>!</p>
            <p>${invitedBy ? `Você foi convidado por <strong>${invitedBy}</strong> para fazer parte da equipe.` : 'Sua conta foi criada com sucesso.'}</p>
            <p>Aqui estão suas credenciais de acesso:</p>
            <div class="credentials-box">
              <div class="credential-row">
                <span class="credential-label">📧 Email:</span><br>
                <span class="credential-value">${to}</span>
              </div>
              <div class="credential-row">
                <span class="credential-label">🔑 Senha:</span><br>
                <span class="credential-value">${tempPassword}</span>
              </div>
            </div>
            <div class="warning">
              ⚠️ <strong>Importante:</strong> Recomendamos que você altere sua senha após o primeiro acesso por questões de segurança.
            </div>
            <a href="${loginUrl}" class="button">Acessar o Sistema</a>
            <p style="font-size: 12px; color: #94a3b8;">Se o botão não funcionar, acesse: ${loginUrl}</p>
          </div>
          <div class="footer">
            Advus - Gestão Jurídica Inteligente<br>
            Este é um e-mail automático, não responda.
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: '🎉 Bem-vindo ao Advus - Suas Credenciais de Acesso',
      html,
    });
  }

  /**
   * Parse User-Agent to human-readable format
   */
  private parseUserAgent(ua?: string): string {
    if (!ua) return 'Navegador desconhecido';

    if (ua.includes('Chrome')) return 'Google Chrome';
    if (ua.includes('Firefox')) return 'Mozilla Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Microsoft Edge';
    if (ua.includes('Opera')) return 'Opera';

    return 'Navegador desconhecido';
  }
}
