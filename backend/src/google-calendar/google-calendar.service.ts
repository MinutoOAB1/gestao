import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private getRedirectUri(): string {
    if (process.env.FRONTEND_URL) {
      const baseUrl = process.env.FRONTEND_URL.replace(/\/$/, '');
      return `${baseUrl}/api/google-calendar/callback`;
    }
    return process.env.GOOGLE_REDIRECT_URI || '';
  }

  private getClient() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      this.getRedirectUri(),
    );
  }

  constructor(private prisma: PrismaService) {}

  getAuthUrl(userId: string) {
    const client = this.getClient();
    return client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      state: userId,
      prompt: 'consent',
    });
  }

  async handleCallback(code: string, userId: string) {
    try {
      const client = this.getClient();
      const { tokens } = await client.getToken(code);
      
      if (tokens.refresh_token) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            googleRefreshToken: tokens.refresh_token,
            googleCalendarConnected: true,
          },
        });
        return { success: true };
      }
      
      throw new Error('Refresh token não recebido do Google');
    } catch (error) {
      this.logger.error(`Erro no callback do Google: ${error.message}`);
      throw error;
    }
  }

  async disconnect(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleRefreshToken: null,
        googleCalendarConnected: false,
      },
    });
    return { success: true };
  }

  private async getAuthenticatedClient(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { googleRefreshToken: true },
    });

    if (!user?.googleRefreshToken) return null;

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    return google.calendar({ version: 'v3', auth: client });
  }

  async upsertEvent(userId: string, eventData: any) {
    const calendar = await this.getAuthenticatedClient(userId);
    if (!calendar) return null;

    const googleEvent = {
      summary: eventData.title,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: new Date(eventData.start).toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: new Date(eventData.end).toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: eventData.reminderMinutes || 30 },
        ],
      },
    };

    try {
      if (eventData.googleEventId) {
        const response = await calendar.events.update({
          calendarId: 'primary',
          eventId: eventData.googleEventId,
          requestBody: googleEvent,
        });
        return response.data.id;
      } else {
        const response = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: googleEvent,
        });
        return response.data.id;
      }
    } catch (error) {
      this.logger.error(`Erro ao sincronizar evento com Google: ${error.message}`);
      return null;
    }
  }

  async deleteEvent(userId: string, googleEventId: string) {
    const calendar = await this.getAuthenticatedClient(userId);
    if (!calendar || !googleEventId) return;

    try {
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: googleEventId,
      });
    } catch (error) {
      this.logger.error(`Erro ao deletar evento no Google: ${error.message}`);
    }
  }
}
