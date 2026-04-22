import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('process.created')
  async handleProcessCreated(payload: any) {
    await this.notifyAllInTenant(payload.tenantId, payload.createdById, {
      type: 'PROCESS',
      title: 'Novo Processo Criado',
      message: `O processo "${payload.title}" foi criado.`,
      entityType: 'PROCESS',
      entityId: payload.processId,
    });
  }

  @OnEvent('process.won')
  async handleProcessWon(payload: any) {
    await this.notifyAllInTenant(payload.tenantId, payload.userId, {
      type: 'PROCESS',
      title: 'Processo Ganho! 🎉',
      message: `O processo "${payload.title}" foi marcado como GANHO.`,
      entityType: 'PROCESS',
      entityId: payload.processId,
    });
  }

  @OnEvent('process.note.created')
  async handleProcessNoteCreated(payload: any) {
    await this.notifyAllInTenant(payload.tenantId, payload.userId, {
      type: 'MENTION',
      title: 'Nova Nota em Processo',
      message: `Uma nova nota foi adicionada ao processo "${payload.processTitle}".`,
      entityType: 'PROCESS_NOTE',
      entityId: payload.processId,
    });
  }

  @OnEvent('client.created')
  async handleClientCreated(payload: any) {
    await this.notifyAllInTenant(payload.tenantId, payload.createdById, {
      type: 'CLIENT',
      title: 'Novo Cliente Cadastrado',
      message: `O cliente "${payload.name}" foi adicionado ao sistema.`,
      entityType: 'CLIENT',
      entityId: payload.clientId,
    });
  }

  @OnEvent('financial.created')
  async handleFinancialCreated(payload: any) {
    await this.notifyAllInTenant(payload.tenantId, payload.userId, {
      type: 'FINANCIAL',
      title: 'Nova Movimentação Financeira',
      message: `Uma nova ${payload.type === 'REVENUE' ? 'receita' : 'despesa'} de R$ ${payload.amount} foi registrada.`,
      entityType: 'FINANCIAL',
      entityId: payload.id,
    });
  }

  @OnEvent('process.updated')
  async handleProcessUpdated(payload: any) {
    await this.notifyAllInTenant(payload.tenantId, payload.userId, {
      type: 'PROCESS',
      title: 'Processo Atualizado',
      message: `O processo "${payload.title}" recebeu uma atualização.`,
      entityType: 'PROCESS',
      entityId: payload.processId,
    });
  }

  @OnEvent('client.updated')
  async handleClientUpdated(payload: any) {
    await this.notifyAllInTenant(payload.tenantId, payload.userId, {
      type: 'CLIENT',
      title: 'Cliente Atualizado',
      message: `Os dados do cliente "${payload.name}" foram atualizados.`,
      entityType: 'CLIENT',
      entityId: payload.clientId,
    });
  }

  @OnEvent('agenda.created')
  async handleAgendaCreated(payload: any) {
    await this.notifyAllInTenant(payload.tenantId, payload.userId, {
      type: 'EVENT',
      title: 'Novo Evento na Agenda',
      message: `O evento "${payload.title}" foi adicionado.`,
      entityType: 'EVENT',
      entityId: payload.eventId,
    });
  }

  @OnEvent('agenda.updated')
  async handleAgendaUpdated(payload: any) {
    await this.notifyAllInTenant(payload.tenantId, payload.userId, {
      type: 'EVENT',
      title: 'Evento Atualizado',
      message: `O evento "${payload.title}" foi modificado na agenda.`,
      entityType: 'EVENT',
      entityId: payload.eventId,
    });
  }

  private async notifyAllInTenant(tenantId: string, actorId: string, notificationData: any) {
    try {
      const users = await this.prisma.user.findMany({
        where: { tenantId },
        select: { id: true },
      });

      for (const user of users) {
        // Option: Don't notify the person who did the action
        if (user.id === actorId) continue;

        await this.notificationsService.create({
          ...notificationData,
          userId: user.id,
          createdById: actorId,
          tenantId,
        });
      }
    } catch (error) {
      this.logger.error(`Error notifying users in tenant ${tenantId}: ${error.message}`);
    }
  }
}
