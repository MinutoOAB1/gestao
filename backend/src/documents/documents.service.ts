import { Injectable } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) { }

  // ==================== ADVANCED FEATURES ====================

  private async logAction(data: { tenantId: string, documentId?: string, action: string, userId: string, details?: string }) {
    try {
      let userName = 'Usuário Dev';
      if (data.userId && data.userId !== 'dev-user-001') {
        const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
        if (user) userName = user.name;
      }

      await this.prisma.documentAuditLog.create({
        data: {
          tenantId: data.tenantId,
          documentId: data.documentId,
          action: data.action,
          userId: data.userId,
          userName: userName,
          details: data.details
        }
      });
    } catch (e) {
      console.error('Audit Log Error:', e);
    }
  }

  // Modified Create with Audit
  async create(createDocumentDto: CreateDocumentDto, tenantId: string, userId: string) {
    // Only set createdById if user actually exists in database
    let createdById: string | null = null;
    if (userId && userId !== 'dev-user-001') {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) createdById = userId;
    }

    const doc = await this.prisma.document.create({
      data: {
        name: createDocumentDto.name,
        type: createDocumentDto.type,
        size: createDocumentDto.size,
        url: createDocumentDto.url,
        folderId: createDocumentDto.folderId,
        tenantId,
        createdById,
      },
    });

    await this.logAction({
      tenantId,
      documentId: doc.id,
      action: 'CREATE',
      userId,
      details: `Arquivo criado: ${doc.name}`
    });

    return doc;
  }

  async updateStatus(id: string, status: string, tenantId: string, userId: string) {
    const doc = await this.prisma.document.update({
      where: { id, tenantId },
      data: { kanbanStatus: status }
    });

    await this.logAction({
      tenantId,
      documentId: id,
      action: 'MOVE',
      userId,
      details: `Status alterado para ${status}`
    });

    return doc;
  }

  async toggleLock(id: string, tenantId: string, userId: string) {
    const doc = await this.findOne(id, tenantId);
    if (!doc) return null;

    const newLockState = !doc.isLocked;

    const updated = await this.prisma.document.update({
      where: { id, tenantId },
      data: { isLocked: newLockState }
    });

    await this.logAction({
      tenantId,
      documentId: id,
      action: newLockState ? 'LOCK' : 'UNLOCK',
      userId,
      details: newLockState ? 'Arquivo bloqueado' : 'Arquivo desbloqueado'
    });

    return updated;
  }

  async setPermissions(id: string, allowedRoles: string, tenantId: string, userId: string) {
    const updated = await this.prisma.document.update({
      where: { id, tenantId },
      data: { allowedRoles }
    });

    await this.logAction({
      tenantId,
      documentId: id,
      action: 'UPDATE',
      userId,
      details: `Permissões alteradas: ${allowedRoles || 'Público'}`
    });

    return updated;
  }

  async getAuditLogs(documentId: string, tenantId: string) {
    return this.prisma.documentAuditLog.findMany({
      where: { documentId, tenantId },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Global audit logs for entire tenant
  async getAllAuditLogs(tenantId: string) {
    return this.prisma.documentAuditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to latest 100 logs
    });
  }

  findAll(tenantId: string, folderId?: string) {
    return this.prisma.document.findMany({
      where: {
        tenantId,
        folderId: folderId ? folderId : null
      },
      orderBy: { createdAt: 'desc' },
      include: {
        folder: true,
        createdBy: { select: { id: true, name: true, avatar: true } }
      }
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.document.findFirst({
      where: { id, tenantId },
    });
  }

  update(id: string, updateDocumentDto: UpdateDocumentDto, tenantId: string) {
    return this.prisma.document.update({
      where: { id, tenantId },
      data: updateDocumentDto,
    });
  }

  // Folders Logic
  createFolder(name: string, parentId: string | undefined, tenantId: string) {
    return this.prisma.folder.create({
      data: {
        name,
        parentId: parentId || null,
        tenantId
      }
    });
  }

  findAllFolders(tenantId: string, parentId?: string) {
    return this.prisma.folder.findMany({
      where: {
        tenantId,
        parentId: parentId ? parentId : null
      },
      orderBy: { name: 'asc' },
      include: { children: true }
    });
  }

  removeFolder(id: string, tenantId: string) {
    return this.prisma.folder.delete({
      where: { id, tenantId }
    });
  }

  async toggleFolderLock(id: string, tenantId: string) {
    const folder = await this.prisma.folder.findUnique({ where: { id, tenantId } });
    if (!folder) throw new Error('Folder not found');
    return this.prisma.folder.update({
      where: { id, tenantId },
      data: { isLocked: !folder.isLocked }
    });
  }


  // Overridden remove with Audit
  async remove(id: string, tenantId: string, userId: string) {
    // Log before delete (or after if we keep log with null documentId)
    // Our schema allows null documentId, so we can log even if doc is gone
    const doc = await this.findOne(id, tenantId);

    await this.prisma.document.delete({
      where: { id, tenantId },
    });

    if (doc) {
      await this.logAction({
        tenantId,
        documentId: undefined, // Link broken
        action: 'DELETE',
        userId,
        details: `Arquivo excluído: ${doc.name}`
      });
    }

    return { success: true };
  }

  // ==================== COMMENTS ====================

  async addComment(documentId: string, content: string, userId: string, tenantId: string) {
    // Ensure the document belongs to the tenant
    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, tenantId }
    });
    if (!doc) throw new Error('Document not found');

    return this.prisma.documentComment.create({
      data: {
        content,
        documentId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });
  }

  async findComments(documentId: string, tenantId: string) {
    // We filter by documentId. Relations ensure document belongs to tenant conceptually 
    // but for safety we can check document ownership if needed.
    return this.prisma.documentComment.findMany({
      where: {
        documentId,
        document: { tenantId }
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });
  }

  async deleteComment(commentId: string, userId: string, tenantId: string) {
    const comment = await this.prisma.documentComment.findFirst({
      where: {
        id: commentId,
        userId, // Only owner can delete (or add admin check)
        document: { tenantId }
      }
    });

    if (!comment) throw new Error('Comment not found or access denied');

    return this.prisma.documentComment.delete({
      where: { id: commentId }
    });
  }
}
