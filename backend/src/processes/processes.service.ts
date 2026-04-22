import { Injectable } from '@nestjs/common';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GoogleCalendarService } from '../google-calendar/google-calendar.service';

@Injectable()
export class ProcessesService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private googleService: GoogleCalendarService,
  ) { }

  // ─── Process CRUD ────────────────────────────────────────

  async create(createProcessDto: CreateProcessDto, tenantId: string, createdById?: string) {
    try {
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

      const deadline = parseDate(createProcessDto.deadline);
      const { deadline: _, number: incomingNumber, ...restDto } = createProcessDto;
      
      const processData: any = {
        ...restDto,
        deadline,
        tenantId,
        status: createProcessDto.status || 'ACTIVE',
      };
      
      if (incomingNumber !== undefined) {
          processData.number = incomingNumber;
      }

      const process = await this.prisma.process.create({
        data: processData,
      });

      // Emit event for AI analysis and ecosystem harmony
      this.eventEmitter.emit('process.created', {
        processId: process.id,
        tenantId: process.tenantId,
        title: process.title,
        description: process.description, // context for AI
        number: process.number,
        createdById
      });

      // Sync with Google Calendar if deadline exists and user is connected
      if (createdById && process.deadline) {
        try {
          const googleEventId = await this.googleService.upsertEvent(createdById, {
            title: `[PROCESSO] ${process.title}`,
            description: `Número: ${process.number || 'N/A'}\n${process.description || ''}`,
            start: process.deadline,
            end: process.deadline,
            type: 'DEADLINE',
          });
          if (googleEventId) {
            await this.prisma.process.update({
              where: { id: process.id },
              data: { googleEventId } as any // Need to check if googleEventId exists in Process model
            });
          }
        } catch (syncError) {
          console.error('Failed to sync process deadline to Google:', syncError);
        }
      }

      return process;
    } catch (error) {
      console.error('Error creating process:', error);
      throw error;
    }
  }

  findAll(tenantId: string, take = 50, skip = 0) {
    return this.prisma.process.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true, email: true } },
        labels: true,
        checklists: { include: { items: true } },
        _count: { select: { comments: true } },
      },
      take,
      skip,
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.process.findFirst({
      where: { id, tenantId },
      include: {
        client: { select: { id: true, name: true, email: true } },
        labels: true,
        checklists: { include: { items: { orderBy: { order: 'asc' } } } },
        comments: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        updates: { orderBy: { date: 'desc' }, take: 10 },
        notes: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async update(id: string, updateProcessDto: UpdateProcessDto, tenantId: string, userId?: string) {
    const data: any = { ...updateProcessDto };

    if (data.deadline) {
      if (typeof data.deadline === 'string' && data.deadline.length === 10) {
        const [year, month, day] = data.deadline.split('-').map(Number);
        data.deadline = new Date(year, month - 1, day, 12, 0, 0);
      } else {
        const d = new Date(data.deadline);
        if (!isNaN(d.getTime())) {
          d.setHours(12, 0, 0, 0);
          data.deadline = d;
        }
      }
    }

    // Handle completion logic
    const isCompleted = data.status === 'GANHO' || data.status === 'COMPLETED' || data.status === 'WON' || data.kanbanColumn === 'Ganho' || data.kanbanColumn === 'Concluído';
    if (isCompleted) {
      data.completedAt = new Date();
    } else if (data.status === 'ACTIVE' || data.status === 'OPEN' || data.kanbanColumn === 'novo') {
      data.completedAt = null;
    }

    const updated = await this.prisma.process.update({
      where: { id, tenantId },
      data,
    });

    // Event Emitter: Emit when a process is marked as won/completed
    if (isCompleted) {
      this.eventEmitter.emit('process.won', {
        processId: updated.id,
        tenantId: updated.tenantId,
        title: updated.title,
        value: updated.value || 0,
        clientId: updated.clientId
      });
    }

    // Sync with Google Calendar if deadline exists and user is connected
    if (updated.deadline && userId) {
      try {
        const googleEventId = await this.googleService.upsertEvent(userId, {
          title: `[PROCESSO] ${updated.title}`,
          description: `Número: ${updated.number || 'N/A'}\n${updated.description || ''}`,
          start: updated.deadline,
          end: updated.deadline,
          type: 'DEADLINE',
          googleEventId: updated.googleEventId,
        });
        if (googleEventId && googleEventId !== updated.googleEventId) {
          await this.prisma.process.update({
            where: { id: updated.id },
            data: { googleEventId }
          });
        }
      } catch (syncError) {
        console.error('Failed to sync process deadline update to Google:', syncError);
      }
    }

    return updated;
  }

  async remove(id: string, tenantId: string, userId?: string) {
    const process = await this.prisma.process.findFirst({
      where: { id, tenantId }
    });

    if (process && process.googleEventId && userId) {
      await this.googleService.deleteEvent(userId, process.googleEventId);
    }

    return this.prisma.process.delete({
      where: { id, tenantId },
    });
  }

  // ─── Checklists ──────────────────────────────────────────

  async createChecklist(processId: string, title: string, tenantId: string) {
    // verify ownership
    await this.prisma.process.findFirstOrThrow({ where: { id: processId, tenantId } });
    return this.prisma.processChecklist.create({
      data: { processId, title },
      include: { items: true },
    });
  }

  async deleteChecklist(checklistId: string) {
    return this.prisma.processChecklist.delete({ where: { id: checklistId } });
  }

  async addChecklistItem(checklistId: string, text: string) {
    const count = await this.prisma.processChecklistItem.count({ where: { checklistId } });
    return this.prisma.processChecklistItem.create({
      data: { checklistId, text, order: count },
    });
  }

  async updateChecklistItem(itemId: string, data: { text?: string; completed?: boolean }) {
    return this.prisma.processChecklistItem.update({
      where: { id: itemId },
      data,
    });
  }

  async deleteChecklistItem(itemId: string) {
    return this.prisma.processChecklistItem.delete({ where: { id: itemId } });
  }

  // ─── Labels ──────────────────────────────────────────────

  async getLabels(tenantId: string) {
    return this.prisma.processLabel.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createLabel(tenantId: string, name: string, color: string) {
    return this.prisma.processLabel.create({
      data: { name, color, tenantId },
    });
  }

  async deleteLabel(labelId: string) {
    return this.prisma.processLabel.delete({ where: { id: labelId } });
  }

  async addLabelToProcess(processId: string, labelId: string, tenantId: string) {
    return this.prisma.process.update({
      where: { id: processId, tenantId },
      data: { labels: { connect: { id: labelId } } },
      include: { labels: true },
    });
  }

  async removeLabelFromProcess(processId: string, labelId: string, tenantId: string) {
    return this.prisma.process.update({
      where: { id: processId, tenantId },
      data: { labels: { disconnect: { id: labelId } } },
      include: { labels: true },
    });
  }

  // ─── Comments ────────────────────────────────────────────

  async getComments(processId: string) {
    return this.prisma.processComment.findMany({
      where: { processId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addComment(processId: string, userId: string, content: string) {
    return this.prisma.processComment.create({
      data: { processId, userId, content },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async deleteComment(commentId: string) {
    return this.prisma.processComment.delete({ where: { id: commentId } });
  }
}

