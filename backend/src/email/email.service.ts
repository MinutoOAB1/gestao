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
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
      
      body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        background-color: #F8FAFC; 
        margin: 0; 
        padding: 40px 20px; 
        -webkit-font-smoothing: antialiased;
      }
      
      .container { 
        max-width: 600px; 
        margin: 0 auto; 
        background: #FFFFFF; 
        border-radius: 20px; 
        overflow: hidden; 
        border: 1px solid #E2E8F0;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      }
      
      .header { 
        background: #0F172A; 
        padding: 44px 40px; 
        text-align: center; 
        border-bottom: 3px solid #4F73F5;
      }

      .logo-text {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 800;
        font-size: 26px;
        letter-spacing: -0.04em;
        color: #FFFFFF;
        margin-bottom: 12px;
        display: inline-block;
      }
      
      .logo-text span { color: #4F73F5; }
      
      .header h1 { 
        color: #FFFFFF; 
        margin: 0; 
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 22px; 
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      
      .content { padding: 40px; }
      
      .content p { 
        color: #475569; 
        line-height: 1.6; 
        margin: 0 0 20px; 
        font-size: 15px;
      }
      
      .user-greeting {
        color: #0F172A !important;
        font-weight: 600;
        font-size: 18px !important;
        margin-bottom: 12px !important;
      }
      
      .button-container {
        text-align: center;
        margin: 32px 0;
      }
      
      .button { 
        display: inline-block; 
        background: #4F73F5; 
        color: #FFFFFF !important; 
        padding: 14px 28px; 
        text-decoration: none; 
        border-radius: 12px; 
        font-weight: 600; 
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 14px;
        letter-spacing: 0.02em;
        box-shadow: 0 4px 6px -1px rgba(79, 115, 245, 0.2), 0 2px 4px -1px rgba(79, 115, 245, 0.1);
      }
      
      .accent-box { 
        background: #F8FAFC; 
        border-radius: 12px;
        border: 1px solid #E2E8F0; 
        padding: 18px; 
        margin: 24px 0; 
      }

      .accent-text {
        color: #334155;
        font-size: 14px;
        line-height: 1.5;
        margin: 0 !important;
      }
      
      .divider {
        height: 1px;
        background: #E2E8F0;
        margin: 30px 0;
      }
      
      .footer { 
        background: #F8FAFC; 
        padding: 24px 40px; 
        text-align: center; 
        border-top: 1px solid #E2E8F0;
      }

      .footer-text {
        font-size: 12px; 
        color: #64748B; 
        line-height: 1.6;
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
      <p>Recebemos uma solicitação para redefinir a segurança da sua conta no ecossistema Advus.</p>
      <p>Para prosseguir com a criação de uma nova credencial, clique no botão de acesso seguro abaixo:</p>
      
      <div class="button-container">
        <a href="${resetUrl}" class="button">Redefinir Senha Premium</a>
      </div>

      <div class="accent-box" style="background: #FFFBEB; border-color: #FDE68A;">
        <p class="accent-text" style="color: #D97706;">
          <strong>Segurança:</strong> Este link expira automaticamente em 1 hora. Se você não solicitou esta alteração, sua conta permanece segura e você pode ignorar este e-mail.
        </p>
      </div>
      
      <div class="divider"></div>
      
      <p class="footer-text" style="color: #64748B; text-align: left; font-size: 13px;">
        Se o botão acima não funcionar, copie e cole o link de segurança em seu navegador:
      </p>
      <a href="${resetUrl}" style="word-break: break-all; color: #4F73F5; font-size: 12px; text-decoration: none; margin-top: 12px; display: block; font-weight: 500;">${resetUrl}</a>
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
        <p class="accent-text" style="margin-bottom: 8px !important;"><strong>📅 Data/Hora:</strong> ${now}</p>
        <p class="accent-text" style="margin-bottom: 8px !important;"><strong>🌐 Endereço IP:</strong> ${details.ip || 'Não disponível'}</p>
        <p class="accent-text"><strong>💻 Dispositivo:</strong> ${this.parseUserAgent(details.userAgent)}</p>
      </div>

      <div class="accent-box" style="background: #FEF2F2; border-color: #FCA5A5;">
        <p class="accent-text" style="color: #DC2626; font-weight: 500;">
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
      
      <div class="accent-box" style="text-align: center; background: #FEF2F2; border-color: #FCA5A5;">
        <div style="font-size: 26px; font-weight: 800; color: #DC2626; margin-bottom: 6px; font-family: 'Plus Jakarta Sans', sans-serif;">📅 ${deadline.date}</div>
        <div style="color: #0F172A; font-weight: 600; font-size: 16px;">${deadline.title}</div>
        ${deadline.processNumber ? `<div style="margin-top: 4px; color: #475569; font-size: 13px; font-weight: 500;">Processo: ${deadline.processNumber}</div>` : ''}
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
    const content = `
      <p class="user-greeting">Olá, ${userName}!</p>
      <p>Há uma nova movimentação importante no seu processo sob gestão:</p>
      
      <div class="accent-box" style="background: #F0FDF4; border-color: #BBF7D0;">
        <div style="font-weight: 700; color: #166534; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif;">Processo: ${update.processNumber}</div>
        <div style="color: #0F172A; font-weight: 600; font-size: 16px; margin: 6px 0 10px;">${update.processTitle}</div>
        <div style="color: #475569; font-size: 14px; line-height: 1.6;">${update.updateDescription}</div>
      </div>

      <div class="button-container">
        <a href="${this.getBaseUrl()}/processos" class="button">Ver Processo</a>
      </div>
    `;

    await this.sendEmail({
      to,
      subject: `📋 Atualização: ${update.processNumber} - ${update.processTitle}`,
      html: this.wrapInBaseTemplate('Atualização de Processo', content),
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

    const content = `
      <p class="user-greeting">Olá, ${userName}!</p>
      <p>${invitedBy ? `Você foi convidado por <strong>${invitedBy}</strong> para fazer parte da equipe.` : 'Sua conta premium foi criada com sucesso.'}</p>
      <p>Abaixo estão suas credenciais de acesso seguro à plataforma Advus:</p>
      
      <div class="accent-box" style="background: #F0FDF4; border-color: #BBF7D0;">
        <div style="margin-bottom: 14px;">
          <span style="color: #166534; font-weight: 600; font-size: 12px; font-family: 'Plus Jakarta Sans', sans-serif; tracking-wider">📧 EMAIL DE ACESSO:</span><br>
          <span style="color: #0F172A; font-family: monospace; font-size: 15px; font-weight: bold; background: #FFFFFF; padding: 6px 12px; border-radius: 6px; border: 1px solid #E2E8F0; display: inline-block; margin-top: 4px;">${to}</span>
        </div>
        <div>
          <span style="color: #166534; font-weight: 600; font-size: 12px; font-family: 'Plus Jakarta Sans', sans-serif; tracking-wider">🔑 SENHA TEMPORÁRIA:</span><br>
          <span style="color: #0F172A; font-family: monospace; font-size: 15px; font-weight: bold; background: #FFFFFF; padding: 6px 12px; border-radius: 6px; border: 1px solid #E2E8F0; display: inline-block; margin-top: 4px;">${tempPassword}</span>
        </div>
      </div>
      
      <div class="accent-box" style="background: #FFFBEB; border-color: #FDE68A;">
        <p class="accent-text" style="color: #D97706; font-weight: 500;">
          ⚠️ <strong>Importante:</strong> Por questões de conformidade e segurança, recomendamos que você altere sua senha no seu primeiro acesso.
        </p>
      </div>

      <div class="button-container">
        <a href="${loginUrl}" class="button">Acessar a Plataforma</a>
      </div>
    `;

    await this.sendEmail({
      to,
      subject: '🎉 Bem-vindo ao Advus - Suas Credenciais de Acesso',
      html: this.wrapInBaseTemplate('Bem-vindo ao Advus', content),
    });
  }

  /**
   * Send daily executive summary with agenda events and financial records
   */
  async sendDailySummaryEmail(
    to: string,
    userName: string,
    data: { events: any[]; financialRecords: any[]; dateStr: string }
  ): Promise<void> {
    let eventsHtml = '';
    if (data.events.length === 0) {
      eventsHtml = `<p style="color: #64748B; font-style: italic; font-size: 14px; margin: 0;">Nenhum compromisso agendado para hoje.</p>`;
    } else {
      eventsHtml = data.events.map(event => {
        const startTime = new Date(event.start).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo'
        });
        return `
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px; margin-bottom: 12px;">
            <div style="color: #4F73F5; font-weight: 700; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif;">⏰ ${startTime}</div>
            <div style="color: #0F172A; font-weight: 600; font-size: 15px; margin: 4px 0 2px;">${event.title}</div>
            ${event.location ? `<div style="color: #475569; font-size: 12px; margin-top: 2px;">📍 ${event.location}</div>` : ''}
            ${event.description ? `<div style="color: #64748B; font-size: 12px; margin-top: 4px;">${event.description}</div>` : ''}
          </div>
        `;
      }).join('');
    }

    let financialHtml = '';
    if (data.financialRecords.length === 0) {
      financialHtml = `<p style="color: #64748B; font-style: italic; font-size: 14px; margin: 0;">Nenhum vencimento financeiro programado para hoje.</p>`;
    } else {
      financialHtml = data.financialRecords.map(record => {
        const isIncome = record.type === 'INCOME' || record.type === 'RECEITA';
        const color = isIncome ? '#10B981' : '#EF4444';
        const badge = isIncome ? '▲ Receita' : '▼ Despesa';
        return `
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="color: ${color}; font-weight: 700; font-size: 11px; text-transform: uppercase; font-family: 'Plus Jakarta Sans', sans-serif;">${badge}</span>
              <strong style="color: #0F172A; font-size: 14px;">R$ ${record.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            <div style="color: #334155; font-size: 13px;">${record.description}</div>
            ${record.category ? `<div style="color: #64748B; font-size: 11px; margin-top: 2px;">Categoria: ${record.category}</div>` : ''}
          </div>
        `;
      }).join('');
    }

    const content = `
      <p class="user-greeting">Olá, ${userName}!</p>
      <p>Aqui está o seu resumo diário do dia <strong>${data.dateStr}</strong> consolidado pela plataforma Advus.</p>
      
      <div class="divider"></div>
      
      <h3 style="color: #0F172A; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; margin-bottom: 12px;">📅 Compromissos de Hoje</h3>
      ${eventsHtml}
      
      <div class="divider"></div>
      
      <h3 style="color: #0F172A; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; margin-bottom: 12px;">💰 Financeiro (A Vencer Hoje)</h3>
      ${financialHtml}
      
      <div class="button-container">
        <a href="${this.getBaseUrl()}/app" class="button">Acessar Advus</a>
      </div>
    `;

    await this.sendEmail({
      to,
      subject: `🌅 Seu Resumo Diário Advus - ${data.dateStr}`,
      html: this.wrapInBaseTemplate('Resumo Executivo Diário', content),
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
