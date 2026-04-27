import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../supabase/storage.service';
import { CreateUserFileDto } from './dto/create-user-file.dto';
import { UpdateUserFileDto } from './dto/update-user-file.dto';

const USER_FILES_BUCKET = 'user-files';

@Injectable()
export class UserFilesService {
    private readonly logger = new Logger(UserFilesService.name);

    constructor(
        private prisma: PrismaService,
        private storageService: StorageService,
    ) { }

    /**
     * Check if user can upload a file (quota validation)
     */
    async canUpload(userId: string, tenantId: string, fileSizeBytes: number): Promise<{ allowed: boolean; reason?: string }> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

        if (!user || !tenant) {
            return { allowed: false, reason: 'Usuário ou conta não encontrada' };
        }

        const fileSizeMb = fileSizeBytes / (1024 * 1024);

        // Check user quota
        const userUsedMb = user.usedStorageMb || 0;
        const userQuotaMb = (user.storageQuotaGb || 1) * 1024;
        if (userUsedMb + fileSizeMb > userQuotaMb) {
            return {
                allowed: false,
                reason: `Quota pessoal excedida. Usado: ${(userUsedMb / 1024).toFixed(2)} GB / ${user.storageQuotaGb} GB`
            };
        }

        // Check tenant quota
        const tenantUsedMb = tenant.usedStorageMb || 0;
        const tenantQuotaMb = (tenant.storageQuotaGb || 3) * 1024;
        if (tenantUsedMb + fileSizeMb > tenantQuotaMb) {
            return {
                allowed: false,
                reason: `Quota da conta excedida. Usado: ${(tenantUsedMb / 1024).toFixed(2)} GB / ${tenant.storageQuotaGb} GB`
            };
        }

        return { allowed: true };
    }

    /**
     * Upload a file for a user
     */
    async uploadFile(
        file: Express.Multer.File,
        userId: string,
        tenantId: string,
        folder?: string,
    ) {
        this.logger.log(`Upload request: user=${userId}, tenant=${tenantId}, file=${file?.originalname}, size=${file?.size}`);

        if (!file) {
            throw new BadRequestException('Arquivo não fornecido');
        }

        try {
            // Validate quota
            const quotaCheck = await this.canUpload(userId, tenantId, file.size);
            if (!quotaCheck.allowed) {
                throw new BadRequestException(quotaCheck.reason);
            }

            // Upload to storage
            const uploadResult = await this.storageService.uploadFile(
                USER_FILES_BUCKET,
                file,
                `${tenantId}/${userId}`,
            );

            // Create database record
            const userFile = await this.prisma.userFile.create({
                data: {
                    name: file.originalname,
                    fileName: uploadResult.fileName,
                    mimeType: file.mimetype,
                    sizeBytes: file.size,
                    url: uploadResult.fileUrl,
                    folder: folder || null,
                    userId,
                    tenantId,
                },
            });

            // Update storage counters
            const fileSizeMb = Math.ceil(file.size / (1024 * 1024)) || 1; // Minimum 1 MB
            await this.updateStorageCounters(userId, tenantId, fileSizeMb);

            this.logger.log(`File uploaded: ${file.originalname} for user ${userId}`);

            return userFile;
        } catch (error: any) {
            this.logger.error(`Upload failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * List files for a user
     */
    async listFiles(userId: string, tenantId: string, folder?: string) {
        return this.prisma.userFile.findMany({
            where: {
                userId,
                tenantId,
                ...(folder !== undefined ? { folder } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get unique folders for a user
     */
    async listFolders(userId: string, tenantId: string): Promise<string[]> {
        const files = await this.prisma.userFile.findMany({
            where: { userId, tenantId, folder: { not: null } },
            select: { folder: true },
            distinct: ['folder'],
        });
        return files.map(f => f.folder!).filter(Boolean);
    }

    /**
     * Get storage statistics for a user
     */
    async getStorageStats(userId: string, tenantId: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { storageQuotaGb: true, usedStorageMb: true }
            });
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { storageQuotaGb: true, usedStorageMb: true, maxUsers: true }
            });

            const fileCount = await this.prisma.userFile.count({
                where: { userId, tenantId }
            });

            return {
                user: {
                    usedGb: ((user?.usedStorageMb || 0) / 1024).toFixed(2),
                    quotaGb: user?.storageQuotaGb || 1,
                    usedMb: user?.usedStorageMb || 0,
                    percentUsed: Math.round(((user?.usedStorageMb || 0) / ((user?.storageQuotaGb || 1) * 1024)) * 100),
                },
                tenant: {
                    usedGb: ((tenant?.usedStorageMb || 0) / 1024).toFixed(2),
                    quotaGb: tenant?.storageQuotaGb || 3,
                    usedMb: tenant?.usedStorageMb || 0,
                    percentUsed: Math.round(((tenant?.usedStorageMb || 0) / ((tenant?.storageQuotaGb || 3) * 1024)) * 100),
                    maxUsers: tenant?.maxUsers || 3,
                },
                fileCount,
            };
        } catch (error: any) {
            this.logger.error(`Failed to get storage stats: ${error.message}`);
            // Return default values on error
            return {
                user: { usedGb: '0.00', quotaGb: 1, usedMb: 0, percentUsed: 0 },
                tenant: { usedGb: '0.00', quotaGb: 3, usedMb: 0, percentUsed: 0, maxUsers: 3 },
                fileCount: 0,
            };
        }
    }

    /**
     * Get a single file by ID
     */
    async findOne(id: string, userId: string, tenantId: string) {
        return this.prisma.userFile.findFirst({
            where: { id, userId, tenantId },
        });
    }

    /**
     * Update file metadata
     */
    async update(id: string, dto: UpdateUserFileDto, userId: string, tenantId: string) {
        const file = await this.findOne(id, userId, tenantId);
        if (!file) {
            throw new BadRequestException('Arquivo não encontrado');
        }

        return this.prisma.userFile.updateMany({
            where: { id, userId, tenantId },
            data: {
                name: dto.name,
                folder: dto.folder,
            },
        });
    }

    /**
     * Delete a file
     */
    async delete(id: string, userId: string, tenantId: string) {
        const file = await this.findOne(id, userId, tenantId);
        if (!file) {
            throw new BadRequestException('Arquivo não encontrado');
        }

        // Delete from storage
        await this.storageService.deleteFile(USER_FILES_BUCKET, file.url);

        // Delete from database (scoped)
        await this.prisma.userFile.deleteMany({ 
            where: { id, userId, tenantId } 
        });

        // Update storage counters (negative to decrease)
        const fileSizeMb = Math.ceil(file.sizeBytes / (1024 * 1024));
        await this.updateStorageCounters(userId, tenantId, -fileSizeMb);

        this.logger.log(`File deleted: ${file.name} for user ${userId}`);

        return { success: true };
    }

    /**
     * Update storage counters for user and tenant
     */
    private async updateStorageCounters(userId: string, tenantId: string, deltaMb: number) {
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: userId },
                data: { usedStorageMb: { increment: deltaMb } },
            }),
            this.prisma.tenant.update({
                where: { id: tenantId },
                data: { usedStorageMb: { increment: deltaMb } },
            }),
        ]);
    }
}
