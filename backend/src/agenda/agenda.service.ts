import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OnEvent } from '@nestjs/event-emitter';

import { AiService } from '../ai/ai.service';
import { GoogleCalendarService } from '../google-calendar/google-calendar.service';

@Injectable()
export class AgendaService {
  private readonly logger = new Logger(AgendaService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private aiService: AiService,
    private googleCalendarService: GoogleCalendarService
  ) { }

  // Create event with optional assignees
  async create(createAgendaDto: CreateAgendaDto, tenantId: string, userId?: string, userName?: string) {
    const { assigneeIds, ...eventData } = createAgendaDto as any;

    const parseDate = (d: any) => {
      if (!d) return undefined;
      if (typeof d === 'string' && d.length === 10) {
        const [year, month, day] = d.split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0);
      }
      const date = new Date(d);
      if (isNaN(date.getTime())) return new Date();
      return date;
    };

    const event = await this.prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        start: parseDate(eventData.start) || new Date(),
        end: parseDate(eventData.end) || parseDate(eventData.start) || new Date(),
        type: eventData.type,
        color: eventData.color,
        completed: eventData.completed || false,
        status: eventData.status || (eventData.completed ? 'FINALIZADO' : 'ATIVO'),
        reminderMinutes: eventData.reminderMinutes ?? 30,
        createdById: userId,
        createdByName: userName,
        processId: eventData.processId || null,
        processNumber: eventData.processNumber || null,
        clientId: eventData.clientId || null,
        clientName: eventData.clientName || null,
        tenantId,
      },
      include: {
        assignees: { select: { id: true, userId: true, userName: true, userEmail: true, status: true } },
        checklistItems: { orderBy: { order: 'asc' } },
      },
    });

    // Add assignees if provided
    if (assigneeIds && assigneeIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: assigneeIds }, tenantId },
        select: { id: true, name: true, email: true },
      });

      await this.prisma.eventAssignee.createMany({
        data: users.map(user => ({
          eventId: event.id,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
        })),
      });

      // Create notifications for assigned users
      const eventDate = new Date(eventData.start).toLocaleDateString('pt-BR');
      const eventTime = new Date(eventData.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      for (const user of users) {
        // Don't notify yourself
        if (user.id === userId) continue;

        try {
          await this.notificationsService.create({
            type: 'ASSIGNMENT',
            title: `${userName || 'Alguém'} adicionou você a um evento`,
            message: `${eventData.title} - ${eventDate} às ${eventTime}`,
            entityType: 'EVENT',
            entityId: event.id,
            userId: user.id,
            createdById: userId,
            tenantId,
          });
        } catch (error) {
          console.error(`Erro ao criar notificação para ${user.id}:`, error);
        }
      }
    }

    // Sync with Google Calendar if user is connected
    if (userId) {
      const googleEventId = await this.googleCalendarService.upsertEvent(userId, event);
      if (googleEventId) {
        await this.prisma.event.update({
          where: { id: event.id },
          data: { googleEventId }
        });
      }
    }

    return event;
  }

  // Get all events with assignees
  findAll(tenantId: string, userId?: string) {
    return this.prisma.event.findMany({
      where: {
        tenantId,
        status: { not: 'SUGESTAO' },
        // If userId provided, filter by creator or assignee
        ...(userId ? {
          OR: [
            { createdById: userId },
            { assignees: { some: { userId } } },
          ],
        } : {}),
      },
      include: {
        assignees: {
          select: {
            id: true,
            userId: true,
            userName: true,
            userEmail: true,
            status: true,
          },
        },
        checklistItems: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { start: 'asc' },
    });
  }

  // Get all events (for shared calendar - no user filter)
  findAllShared(tenantId: string) {
    return this.prisma.event.findMany({
      where: { tenantId, status: { not: 'SUGESTAO' } },
      include: {
        assignees: {
          select: {
            id: true,
            userId: true,
            userName: true,
            userEmail: true,
            status: true,
          },
        },
        checklistItems: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { start: 'asc' },
    });
  }

  // Get events for a specific user (assigned to them)
  findByUser(tenantId: string, userId: string) {
    return this.prisma.event.findMany({
      where: {
        tenantId,
        status: { not: 'SUGESTAO' },
        OR: [
          { createdById: userId },
          { assignees: { some: { userId } } },
        ],
      },
      include: {
        assignees: {
          select: {
            id: true,
            userId: true,
            userName: true,
            userEmail: true,
            status: true,
          },
        },
        checklistItems: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { start: 'asc' },
    });
  }

  // Get single event with assignees
  findOne(id: string, tenantId: string) {
    return this.prisma.event.findFirst({
      where: { id, tenantId },
      include: {
        assignees: {
          select: {
            id: true,
            userId: true,
            userName: true,
            userEmail: true,
            status: true,
          },
        },
        checklistItems: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  // Update event and assignees
  async update(id: string, updateAgendaDto: UpdateAgendaDto, tenantId: string) {
    const existing = await this.prisma.event.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      throw new Error('Event not found');
    }

    const { assigneeIds, ...eventData } = updateAgendaDto as any;

    const parseDate = (d: any) => {
      if (!d) return undefined;
      if (typeof d === 'string' && d.length === 10) {
        const [year, month, day] = d.split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0);
      }
      const date = new Date(d);
      if (isNaN(date.getTime())) return undefined;
      return date;
    };

    const data: any = { ...eventData };
    if (data.start) data.start = parseDate(data.start);
    if (data.end) data.end = parseDate(data.end);
    if (data.status) {
      data.completed = data.status === 'FINALIZADO';
    } else if (data.completed !== undefined) {
      data.status = data.completed ? 'FINALIZADO' : 'ATIVO';
    }

    if (data.clientId === '') data.clientId = null;
    if (data.processId === '') data.processId = null;
    if (data.processNumber === '') data.processNumber = null;

    // Update event
    const updated = await this.prisma.event.update({
      where: { id },
      data,
      include: {
        assignees: { select: { id: true, userId: true, userName: true, userEmail: true, status: true } },
        checklistItems: { orderBy: { order: 'asc' } },
      },
    });

    // Update assignees if provided
    if (assigneeIds !== undefined) {
      // Remove existing assignees
      await this.prisma.eventAssignee.deleteMany({
        where: { eventId: id },
      });

      // Add new assignees
      if (assigneeIds.length > 0) {
        const users = await this.prisma.user.findMany({
          where: { id: { in: assigneeIds }, tenantId },
          select: { id: true, name: true, email: true },
        });

        await this.prisma.eventAssignee.createMany({
          data: users.map(user => ({
            eventId: id,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
          })),
        });
      }
    }

    // If assignees were updated, re-fetch to get fresh data; otherwise return directly
    // Sync with Google Calendar
    const eventToSync = assigneeIds !== undefined ? await this.prisma.event.findFirst({
        where: { id, tenantId },
        include: { assignees: true }
    }) : updated;

    if (eventToSync && eventToSync.createdById) {
      const googleEventId = await this.googleCalendarService.upsertEvent(eventToSync.createdById, eventToSync);
      if (googleEventId && googleEventId !== eventToSync.googleEventId) {
        await this.prisma.event.update({
          where: { id },
          data: { googleEventId }
        });
      }
    }

    if (assigneeIds !== undefined) {
      return this.prisma.event.findFirst({
        where: { id, tenantId },
        include: {
          assignees: { select: { id: true, userId: true, userName: true, userEmail: true, status: true } },
          checklistItems: { orderBy: { order: 'asc' } },
        },
      });
    }
    return updated;
  }

  // Update assignee status (accept/decline)
  async updateAssigneeStatus(eventId: string, userId: string, status: string, tenantId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    return this.prisma.eventAssignee.update({
      where: { eventId_userId: { eventId, userId } },
      data: { status },
    });
  }

  // Toggle completed status
  async toggleComplete(id: string, tenantId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, tenantId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    return this.prisma.event.update({
      where: { id },
      data: { 
        completed: !event.completed,
        status: !event.completed ? 'FINALIZADO' : 'ATIVO'
      },
    });
  }

  // Delete event
  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.event.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      throw new Error('Event not found');
    }

    // Delete from Google Calendar if sync'd
    if (existing.createdById && existing.googleEventId) {
      await this.googleCalendarService.deleteEvent(existing.createdById, existing.googleEventId);
    }

    return this.prisma.event.delete({
      where: { id },
    });
  }

  // Add checklist item to event
  async addChecklistItem(eventId: string, text: string, tenantId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });

    if (!event) throw new Error('Event not found');

    // Get current max order
    const lastItem = await this.prisma.eventChecklistItem.findFirst({
      where: { eventId },
      orderBy: { order: 'desc' },
    });

    const nextOrder = lastItem ? lastItem.order + 1 : 0;

    return this.prisma.eventChecklistItem.create({
      data: {
        text,
        order: nextOrder,
        eventId,
      },
    });
  }

  // Toggle checklist item completed status
  async toggleChecklistItem(itemId: string, tenantId: string) {
    const item = await this.prisma.eventChecklistItem.findUnique({
      where: { id: itemId },
      include: { event: true },
    });

    if (!item || item.event.tenantId !== tenantId) {
      throw new Error('Checklist item not found');
    }

    return this.prisma.eventChecklistItem.update({
      where: { id: itemId },
      data: { completed: !item.completed },
    });
  }

  // Remove checklist item
  async removeChecklistItem(itemId: string, tenantId: string) {
    const item = await this.prisma.eventChecklistItem.findUnique({
      where: { id: itemId },
      include: { event: true },
    });

    if (!item || item.event.tenantId !== tenantId) {
      throw new Error('Checklist item not found');
    }

    return this.prisma.eventChecklistItem.delete({
      where: { id: itemId },
    });
  }

  // Get upcoming deadlines (next 7 days)
  async getUpcomingDeadlines(tenantId: string, userId?: string) {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.event.findMany({
      where: {
        tenantId,
        type: 'DEADLINE',
        completed: false,
        status: { not: 'SUGESTAO' },
        start: {
          gte: now,
          lte: nextWeek,
        },
        ...(userId ? {
          OR: [
            { createdById: userId },
            { assignees: { some: { userId } } },
          ],
        } : {}),
      },
      include: {
        assignees: true,
        checklistItems: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { start: 'asc' },
    });
  }

  // Cron job to sweep for upcoming events and dispatch notifications
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCronReminders() {
    this.logger.debug('Checking for upcoming agenda events...');
    try {
      const now = new Date();

      // Find events that are not completed, haven't had a reminder sent, and start time is within reminderMinutes
      const upcomingEvents = await this.prisma.event.findMany({
        where: {
          completed: false,
          reminderSent: false,
          status: { not: 'SUGESTAO' },
        },
        include: {
          assignees: true,
        },
      });

      for (const event of upcomingEvents) {
        const timeDiffMs = event.start.getTime() - now.getTime();
        const minutesDiff = Math.floor(timeDiffMs / 60000);
        const reminderTime = event.reminderMinutes ?? 30;

        // If the event starts within the reminder window (e.g., in less than or equal to reminderTime, and is in the future or very recent past)
        if (minutesDiff <= reminderTime && minutesDiff > -5) {
          // Send notification to the creator
          if (event.createdById) {
            await this.notificationsService.create({
              type: 'SYSTEM',
              title: 'Lembrete de Compromisso ✨',
              message: `${event.title} - ${event.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
              entityType: 'EVENT',
              entityId: event.id,
              userId: event.createdById,
              tenantId: event.tenantId,
            });
          }

          // Send notification to all assignees
          for (const assignee of event.assignees) {
            // Don't notify the creator twice
            if (assignee.userId === event.createdById) continue;

            await this.notificationsService.create({
              type: 'SYSTEM',
              title: 'Lembrete de Compromisso ✨',
              message: `${event.title} - ${event.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
              entityType: 'EVENT',
              entityId: event.id,
              userId: assignee.userId,
              tenantId: event.tenantId,
            });
          }

          // Mark reminder as sent
          await this.prisma.event.update({
            where: { id: event.id },
            data: { reminderSent: true },
          });

          this.logger.debug(`Reminder sent for event: ${event.title}`);
        }
      }
    } catch (error) {
      this.logger.error('Error processing agenda reminders cron job', error);
    }
  }

  @OnEvent('process.won')
  async handleProcessWon(payload: any) {
    const { processId, tenantId, title } = payload;
    
    try {
      if (processId) {
          const updated = await this.prisma.event.updateMany({
            where: { processId, tenantId, completed: false },
            data: { completed: true, status: 'FINALIZADO' }
          });
          this.logger.log(`[Event Ecosystem] ${updated.count} evento(s) pendente(s) concluído(s) automaticamente para o processo ganho: ${title}`);
      }
    } catch (err) {
      this.logger.error(`[Event Ecosystem Error] Falha ao auto-concluir eventos para processo ${processId}:`, err);
    }
  }

  @OnEvent('process.created', { async: true })
  async handleProcessCreated(payload: { processId: string, tenantId: string, title: string, description?: string, number: string, createdById?: string }) {
    try {
      this.logger.log(`[AI Copilot] Analisando novo processo criado: ${payload.title}`);
      
      const contentToAnalyze = payload.description || `Novo processo criado: ${payload.title}`;
      const suggestedTasks = await this.aiService.analyzeProcessNoteForTasks(contentToAnalyze, { title: payload.title, number: payload.number });
      
      await this.processSuggestedTasks(suggestedTasks, payload);
    } catch (err) {
      this.logger.error(`[AI Copilot Error] Falha ao processar novo processo ${payload.processId}`, err);
    }
  }

  @OnEvent('process.note.created', { async: true })
  async handleProcessNoteCreated(payload: { noteId: string, processId: string, tenantId: string, content: string, createdById?: string }) {
    try {
      this.logger.log(`[AI Copilot] Analisando nota recém-criada do processo ${payload.processId}`);
      
      const process = await this.prisma.process.findUnique({ where: { id: payload.processId }});
      if (!process) return;

      const suggestedTasks = await this.aiService.analyzeProcessNoteForTasks(payload.content, { title: process.title, number: process.number });
      
      await this.processSuggestedTasks(suggestedTasks, { ...payload, title: process.title, number: process.number, clientId: process.clientId || undefined });
    } catch (err) {
      this.logger.error(`[AI Copilot Error] Falha ao processar a nota ${payload.noteId}`, err);
    }
  }

  private async processSuggestedTasks(suggestedTasks: any[], context: { processId: string, tenantId: string, title: string, number: string, createdById?: string, clientId?: string }) {
    if (!suggestedTasks || suggestedTasks.length === 0) return;

    this.logger.log(`[AI Copilot] Gerando ${suggestedTasks.length} sugestões para ${context.title}`);

    for (const task of suggestedTasks) {
      let eventDate = new Date();
      if (task.suggestedDate) {
        const parsed = new Date(task.suggestedDate);
        if (!isNaN(parsed.getTime())) eventDate = parsed;
      }

      // Prevent duplication: check if a suggestion with same process and similar title exists within last 24 horas
      const existing = await this.prisma.event.findFirst({
        where: {
          processId: context.processId,
          type: 'AI_SUGGESTION',
          title: { contains: task.title },
          createdAt: {
             gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      if (existing) {
        this.logger.log(`[AI Copilot] Ignorando sugestão duplicada: ${task.title}`);
        continue;
      }

      const newEvent = await this.prisma.event.create({
        data: {
          title: `[IA] Sugestão: ${task.title}`,
          description: `Gerado automaticamente via Copiloto.\n\nContexto: ${task.description}`,
          start: eventDate,
          end: eventDate,
          type: 'AI_SUGGESTION',
          status: 'SUGESTAO', // Workflow altered: Needs approval
          tenantId: context.tenantId,
          processId: context.processId,
          processNumber: context.number,
          clientId: context.clientId,
          createdById: context.createdById,
          createdByName: 'Copiloto IA'
        }
      });

      if (context.createdById) {
        await this.notificationsService.create({
          type: 'SYSTEM',
          title: 'Copiloto de IA 🤖',
          message: `Sugerimos uma tarefa para ${context.number}:\n${task.title}`,
          entityType: 'EVENT',
          entityId: newEvent.id,
          tenantId: context.tenantId,
          userId: context.createdById
        });
      }
    }
  }
}
