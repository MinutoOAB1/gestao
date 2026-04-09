import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'fs';
import { join, extname } from 'path';

export interface UploadResult {
    fileName: string;
    fileUrl: string;
    fileSize: string;
    fileType: string;
}

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly useSupabase: boolean;
    private readonly localUploadDir: string;

    constructor(
        private supabaseService: SupabaseService,
        private configService: ConfigService,
    ) {
        this.useSupabase = this.supabaseService.isSupabaseConfigured();
        this.localUploadDir = join(process.cwd(), 'uploads');

        if (this.useSupabase) {
            this.logger.log('✅ Using Supabase Storage for file uploads');
        } else {
            this.logger.log('📁 Using local file storage (Supabase not configured)');
            // Ensure local upload directories exist
            this.ensureLocalDirs();
        }
    }

    /**
     * Ensure local upload directories exist
     */
    private ensureLocalDirs(): void {
        const dirs = ['chat', 'templates', 'previews', 'documents', 'avatars', 'user-files'];
        for (const dir of dirs) {
            const fullPath = join(this.localUploadDir, dir);
            if (!existsSync(fullPath)) {
                mkdirSync(fullPath, { recursive: true });
            }
        }
    }

    /**
     * Upload a file (abstracts Supabase vs local storage)
     */
    async uploadFile(
        bucket: string,
        file: Express.Multer.File,
        tenantId?: string,
    ): Promise<UploadResult> {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        const fileName = `${uniqueSuffix}${ext}`;
        const path = tenantId ? `${tenantId}/${fileName}` : fileName;

        let fileUrl: string;

        if (this.useSupabase) {
            // Upload to Supabase Storage
            const url = await this.supabaseService.uploadFile(
                bucket,
                path,
                file.buffer,
                file.mimetype,
            );
            fileUrl = url || `/uploads/${bucket}/${fileName}`; // Fallback to local path
        } else {
            // Save to local filesystem
            const localDir = join(this.localUploadDir, bucket);
            if (!existsSync(localDir)) {
                mkdirSync(localDir, { recursive: true });
            }
            const localPath = join(localDir, fileName);
            writeFileSync(localPath, file.buffer);
            fileUrl = `/uploads/${bucket}/${fileName}`;
        }

        return {
            fileName: file.originalname,
            fileUrl,
            fileSize: this.formatSize(file.size),
            fileType: file.mimetype,
        };
    }

    /**
     * Upload file from buffer directly
     */
    async uploadBuffer(
        bucket: string,
        buffer: Buffer,
        originalName: string,
        mimeType: string,
        tenantId?: string,
    ): Promise<string> {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(originalName);
        const fileName = `${uniqueSuffix}${ext}`;
        const path = tenantId ? `${tenantId}/${fileName}` : fileName;

        if (this.useSupabase) {
            const url = await this.supabaseService.uploadFile(bucket, path, buffer, mimeType);
            return url || `/uploads/${bucket}/${fileName}`;
        } else {
            const localDir = join(this.localUploadDir, bucket);
            if (!existsSync(localDir)) {
                mkdirSync(localDir, { recursive: true });
            }
            const localPath = join(localDir, fileName);
            writeFileSync(localPath, buffer);
            return `/uploads/${bucket}/${fileName}`;
        }
    }

    /**
     * Delete a file
     */
    async deleteFile(bucket: string, fileUrl: string): Promise<boolean> {
        if (this.useSupabase) {
            // Extract path from URL
            const urlParts = fileUrl.split(`/${bucket}/`);
            if (urlParts.length > 1) {
                return this.supabaseService.deleteFile(bucket, urlParts[1]);
            }
        } else {
            // Delete from local filesystem
            try {
                const fileName = fileUrl.split('/').pop();
                if (fileName) {
                    const localPath = join(this.localUploadDir, bucket, fileName);
                    if (existsSync(localPath)) {
                        unlinkSync(localPath);
                        return true;
                    }
                }
            } catch (error) {
                this.logger.error(`Failed to delete file: ${error}`);
            }
        }
        return false;
    }

    /**
     * Get file buffer (for downloads)
     */
    async getFileBuffer(bucket: string, fileUrl: string): Promise<Buffer | null> {
        if (!this.useSupabase) {
            // Read from local filesystem
            try {
                const fileName = fileUrl.split('/').pop();
                if (fileName) {
                    const localPath = join(this.localUploadDir, bucket, fileName);
                    if (existsSync(localPath)) {
                        return readFileSync(localPath);
                    }
                }
            } catch (error) {
                this.logger.error(`Failed to read file: ${error}`);
            }
        }
        // For Supabase, files are accessed via URL directly
        return null;
    }

    /**
     * Check if using Supabase storage
     */
    isUsingSupabase(): boolean {
        return this.useSupabase;
    }

    /**
     * Format file size to human-readable string
     */
    private formatSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}
