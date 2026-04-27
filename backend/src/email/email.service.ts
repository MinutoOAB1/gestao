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

    if (apiKey) {
      this.resend = new Resend(apiKey);
      const maskedKey = apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
      this.logger.log('✅ Resend email service initialized');
      this.logger.log(`🔑 API Key (masked): ${maskedKey}`);
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

  private getBaseStyles(): string {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=Inter:wght@400;500&display=swap');
      
      body { 
        font-family: 'Inter', 'Segoe UI', Tahoma, sans-serif; 
        background-color: #020617; 
        margin: 0; 
        padding: 40px 20px; 
        -webkit-font-smoothing: antialiased;
      }
      
      .container { 
        max-width: 600px; 
        margin: 0 auto; 
        background: #0F172A; 
        border-radius: 24px; 
        overflow: hidden; 
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      }
      
      .header { 
        background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%); 
        padding: 48px 40px; 
        text-align: center; 
        position: relative;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .logo-text {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 800;
        font-size: 32px;
        letter-spacing: -0.05em;
        color: #FFFFFF;
        margin-bottom: 24px;
        display: inline-block;
      }
      
      .logo-text span { color: rgba(255, 255, 255, 0.5); }
      
      .header h1 { 
        color: white; 
        margin: 0; 
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 28px; 
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      
      .content { padding: 48px 40px; }
      
      .content p { 
        color: #94A3B8; 
        line-height: 1.7; 
        margin: 0 0 20px; 
        font-size: 16px;
      }
      
      .user-greeting {
        color: #FFFFFF !important;
        font-weight: 600;
        font-size: 18px !important;
        margin-bottom: 12px !important;
      }
      
      .button-container {
        text-align: center;
        margin: 40px 0;
      }
      
      .button { 
        display: inline-block; 
        background: #6366F1; 
        color: #FFFFFF !important; 
        padding: 18px 36px; 
        text-decoration: none; 
        border-radius: 16px; 
        font-weight: 700; 
        font-family: 'Plus Jakarta Sans', sans-serif;
        text-transform: uppercase;
        font-size: 14px;
        letter-spacing: 0.05em;
        box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
      }
      
      .accent-box { 
        background: rgba(99, 102, 241, 0.05); 
        border-radius: 16px;
        border: 1px solid rgba(99, 102, 241, 0.1); 
        padding: 20px; 
        margin: 30px 0; 
      }

      .accent-text {
        color: #6366F1;
        font-size: 14px;
        line-height: 1.5;
        margin: 0 !important;
      }
      
      .divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.05);
        margin: 40px 0;
      }
      
      .footer { 
        background: #020617; 
        padding: 32px 40px; 
        text-align: center; 
      }

      .footer-text {
        font-size: 12px; 
        color: #475569; 
        line-height: 1.8;
        margin: 0;
        font-weight: 500;
      }
    `;
  }

  private wrapInBaseTemplate(title: string, content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>${this.getBaseStyles()}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-text">ADV<span>US</span></div>
            <h1>${title}</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p class="footer-text">
              © 2026 Advus Premium - Gestão Jurídica Inteligente<br>
              Ambiente de segurança criptografada AES-256-GCM.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(to: string, resetToken: string, userName: string): Promise<void> {
    const resetUrl = `${this.getBaseUrl()}/reset-password/${resetToken}`;

    const content = `
      <p class="user-greeting">Olá, ${userName}!</p>
      <p>Recebemos uma solicitação para redefinir a segurança da sua conta premium no ecossistema Advus.</p>
      <p>Para prosseguir com a criação de uma nova credencial, clique no botão de acesso seguro abaixo:</p>
      
      <div class="button-container">
        <a href="${resetUrl}" class="button">Redefinir Senha Premium</a>
      </div>

      <div class="accent-box" style="background: rgba(245, 158, 11, 0.05); border-color: rgba(245, 158, 11, 0.1);">
        <p class="accent-text" style="color: #F59E0B;">
          <strong>Segurança:</strong> Este link expira automaticamente em 1 hora. Se você não solicitou esta alteração, sua conta permanece segura e você pode ignorar este e-mail.
        </p>
      </div>
      
      <div class="divider"></div>
      
      <p class="footer-text" style="color: #64748B; text-align: left;">
        Se o botão acima não funcionar, copie e cole o link de segurança em seu navegador:
      </p>
      <a href="${resetUrl}" style="word-break: break-all; color: #475569; font-size: 11px; text-decoration: none; margin-top: 16px; display: block;">${resetUrl}</a>
    `;

    await this.sendEmail({
      to,
      subject: '🔐 Redefinição de Senha - Advus',
      html: this.wrapInBaseTemplate('Redefinição de Senha', content),
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

    const content = `
      <p class="user-greeting">Olá, ${userName}!</p>
      <p>Detectamos um novo acesso à sua conta premium de um dispositivo não reconhecido.</p>
      
      <div class="accent-box">
        <p class="accent-text"><strong>📅 Data/Hora:</strong> ${now}</p>
        <p class="accent-text"><strong>🌐 Endereço IP:</strong> ${details.ip || 'Não disponível'}</p>
        <p class="accent-text"><strong>💻 Dispositivo:</strong> ${this.parseUserAgent(details.userAgent)}</p>
      </div>

      <div class="accent-box" style="background: rgba(239, 68, 68, 0.05); border-color: rgba(239, 68, 68, 0.1);">
        <p class="accent-text" style="color: #EF4444;">
          ⚠️ Se você não reconhece este login, sua conta pode estar em risco. Recomendamos alterar sua senha imediatamente e ativar a autenticação de dois fatores (2FA).
        </p>
      </div>
    `;

    await this.sendEmail({
      to,
      subject: '🔔 Novo Login Detectado - Advus',
      html: this.wrapInBaseTemplate('Novo Login Detectado', content),
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
    const content = `
      <p class="user-greeting">Olá, ${userName}!</p>
      <p>${options.message}</p>
      ${options.actionUrl ? `
        <div class="button-container">
          <a href="${options.actionUrl}" class="button">${options.actionLabel || 'Ver Detalhes'}</a>
        </div>
      ` : ''}
    `;

    await this.sendEmail({
      to,
      subject: `📬 ${options.title}`,
      html: this.wrapInBaseTemplate(options.title, content),
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
    const content = `
      <p class="user-greeting">Olá, ${userName}!</p>
      <p>Este é um lembrete automático sobre um prazo processual importante no seu ecossistema jurídico:</p>
      
      <div class="accent-box" style="text-align: center; background: rgba(239, 68, 68, 0.05); border-color: rgba(239, 68, 68, 0.1);">
        <div style="font-size: 24px; font-weight: 800; color: #EF4444; margin-bottom: 8px;">📅 ${deadline.date}</div>
        <div style="color: #FFFFFF; font-weight: 600; font-size: 16px;">${deadline.title}</div>
        ${deadline.processNumber ? `<div style="margin-top: 4px; color: #94A3B8; font-size: 14px;">Processo: ${deadline.processNumber}</div>` : ''}
      </div>

      <div class="button-container">
        <a href="${this.getBaseUrl()}/agenda" class="button">Ver na Agenda</a>
      </div>
    `;

    await this.sendEmail({
      to,
      subject: `⏰ Lembrete: ${deadline.title}`,
      html: this.wrapInBaseTemplate('Lembrete de Prazo', content),
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
