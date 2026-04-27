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

      const { deadline: _, number: incomingNumber, urgency, type, tribunal, court, ...rest } = createProcessDto as any;
      
      const processData: any = {
        ...rest,
        court: court || tribunal,
        deadline: parseDate(createProcessDto.deadline),
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

  findAll(tenantId: string, filters?: { tribunal?: string; court?: string; area?: string; status?: string; clientId?: string; processId?: string; limit?: number; page?: number }, take = 50, skip = 0) {
    const where: any = { tenantId };
    
    // Support both 'tribunal' and 'court' as aliases for the same field
    const courtFilter = filters?.court || filters?.tribunal;
    if (courtFilter) {
      where.court = { contains: courtFilter, mode: 'insensitive' };
    }
    // Note: 'area' field does not exist in the schema - ignore it to prevent Prisma errors
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }
    if (filters?.processId) {
      where.id = filters.processId;
    }

    return this.prisma.process.findMany({
      where,
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
    const { deadline: deadlineRaw, number: incomingNumber, urgency, type, tribunal, court, comment, ...rest } = updateProcessDto as any;

    const parseDate = (d: any) => {
      if (!d) return undefined;
      const date = new Date(d);
      if (isNaN(date.getTime())) return undefined;
      date.setHours(12, 0, 0, 0);
      return date;
    };

    const processData: any = {
      ...rest,
    };

    if (court || tribunal) processData.court = court || tribunal;
    if (deadlineRaw !== undefined) processData.deadline = parseDate(deadlineRaw);
    if (incomingNumber !== undefined) processData.number = incomingNumber;

    // Handle completion logic
    const isCompleted = processData.status === 'GANHO' || processData.status === 'COMPLETED' || processData.status === 'WON' || processData.kanbanColumn === 'Ganho' || processData.kanbanColumn === 'Concluído';
    if (isCompleted) {
      processData.completedAt = new Date();
    } else if (processData.status === 'ACTIVE' || processData.status === 'OPEN' || processData.kanbanColumn === 'novo') {
      processData.completedAt = null;
    }

    const updated = await this.prisma.process.update({
      where: { id, tenantId },
      data: processData,
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

    this.eventEmitter.emit('process.updated', {
      processId: updated.id,
      title: updated.title,
      tenantId,
      userId
    });

    return updated;
  }

  async remove(id: string, tenantId: string, userId?: string) {
    const process = await this.prisma.process.findFirst({
      where: { id, tenantId }
    });

    if (process && process.googleEventId && userId) {
      await this.googleService.deleteEvent(userId, process.googleEventId);
    }

    const deleted = await this.prisma.process.delete({
      where: { id, tenantId },
    });

    if (process) {
      this.eventEmitter.emit('process.removed', {
        processId: id,
        title: process.title,
        tenantId,
        userId
      });
    }

    return deleted;
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

  async deleteChecklist(checklistId: string, tenantId: string) {
    return this.prisma.processChecklist.deleteMany({ 
      where: { 
        id: checklistId, 
        process: { tenantId } 
      } 
    });
  }

  async addChecklistItem(checklistId: string, text: string, tenantId: string) {
    // verify ownership through process
    const checklist = await this.prisma.processChecklist.findUnique({
      where: { id: checklistId },
      include: { process: { select: { tenantId: true } } }
    });
    if (!checklist || checklist.process.tenantId !== tenantId) {
      throw new Error('Checklist not found or access denied');
    }
    const count = await this.prisma.processChecklistItem.count({ where: { checklistId } });
    return this.prisma.processChecklistItem.create({
      data: { checklistId, text, order: count },
    });
  }

  async updateChecklistItem(itemId: string, data: { text?: string; completed?: boolean }, tenantId: string) {
    // verify ownership through checklist -> process
    const item = await this.prisma.processChecklistItem.findUnique({
      where: { id: itemId },
      include: { checklist: { include: { process: { select: { tenantId: true } } } } }
    });
    if (!item || item.checklist.process.tenantId !== tenantId) {
      throw new Error('Item not found or access denied');
    }
    return this.prisma.processChecklistItem.update({
      where: { id: itemId },
      data,
    });
  }

  async deleteChecklistItem(itemId: string, tenantId: string) {
    return this.prisma.processChecklistItem.deleteMany({ 
      where: { 
        id: itemId, 
        checklist: { process: { tenantId } } 
      } 
    });
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

  async deleteLabel(labelId: string, tenantId: string) {
    return this.prisma.processLabel.deleteMany({ 
      where: { id: labelId, tenantId } 
    });
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

  async getComments(processId: string, tenantId: string) {
    // verify ownership
    await this.prisma.process.findFirstOrThrow({ where: { id: processId, tenantId } });
    return this.prisma.processComment.findMany({
      where: { processId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addComment(processId: string, userId: string, content: string, tenantId: string) {
    // verify ownership
    await this.prisma.process.findFirstOrThrow({ where: { id: processId, tenantId } });
    return this.prisma.processComment.create({
      data: { processId, userId, content },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async deleteComment(commentId: string, tenantId: string) {
    return this.prisma.processComment.deleteMany({ 
      where: { 
        id: commentId, 
        process: { tenantId } 
      } 
    });
  }
}

