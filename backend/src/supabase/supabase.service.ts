import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
    private client: SupabaseClient | null = null;
    private readonly logger = new Logger(SupabaseService.name);
    private readonly isConfigured: boolean;

    constructor(private configService: ConfigService) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        this.isConfigured = !!(supabaseUrl && supabaseKey);

        if (this.isConfigured) {
            this.client = createClient(supabaseUrl!, supabaseKey!, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            });
            this.logger.log('✅ Supabase client initialized');
        } else {
            this.logger.warn('⚠️ Supabase not configured - using local storage fallback');
        }
    }

    /**
     * Check if Supabase is configured
     */
    isSupabaseConfigured(): boolean {
        return this.isConfigured && this.client !== null;
    }

    /**
     * Get the Supabase client (for advanced operations)
     */
    getClient(): SupabaseClient | null {
        return this.client;
    }

    /**
     * Upload a file to Supabase Storage
     * @param bucket - Storage bucket name (documents, templates, avatars, chat)
     * @param path - Path within the bucket (e.g., 'tenant-id/filename.pdf')
     * @param file - File buffer or Blob
     * @param contentType - MIME type of the file
     * @returns Public URL of the uploaded file or null on error
     */
    async uploadFile(
        bucket: string,
        path: string,
        file: Buffer | Blob,
        contentType: string,
    ): Promise<string | null> {
        if (!this.client) {
            this.logger.warn('Supabase not configured, cannot upload file');
            return null;
        }

        try {
            // Ensure bucket exists (create if not)
            await this.ensureBucketExists(bucket);

            const { data, error } = await this.client.storage
                .from(bucket)
                .upload(path, file, {
                    contentType,
                    upsert: true, // Overwrite if exists
                });

            if (error) {
                this.logger.error(`Upload error: ${error.message}`);
                return null;
            }

            // Get public URL
            const { data: urlData } = this.client.storage
                .from(bucket)
                .getPublicUrl(path);

            return urlData.publicUrl;
        } catch (error) {
            this.logger.error(`Failed to upload file: ${error}`);
            return null;
        }
    }

    /**
     * Delete a file from Supabase Storage
     */
    async deleteFile(bucket: string, path: string): Promise<boolean> {
        if (!this.client) {
            return false;
        }

        try {
            const { error } = await this.client.storage
                .from(bucket)
                .remove([path]);

            if (error) {
                this.logger.error(`Delete error: ${error.message}`);
                return false;
            }

            return true;
        } catch (error) {
            this.logger.error(`Failed to delete file: ${error}`);
            return false;
        }
    }

    /**
     * Get a signed URL for temporary access (e.g., for private files)
     */
    async getSignedUrl(
        bucket: string,
        path: string,
        expiresIn: number = 3600,
    ): Promise<string | null> {
        if (!this.client) {
            return null;
        }

        try {
            const { data, error } = await this.client.storage
                .from(bucket)
                .createSignedUrl(path, expiresIn);

            if (error) {
                this.logger.error(`Signed URL error: ${error.message}`);
                return null;
            }

            return data.signedUrl;
        } catch (error) {
            this.logger.error(`Failed to get signed URL: ${error}`);
            return null;
        }
    }

    /**
     * Ensure a storage bucket exists, create if not
     */
    private async ensureBucketExists(bucket: string): Promise<void> {
        if (!this.client) return;

        try {
            const { data: buckets } = await this.client.storage.listBuckets();
            const exists = buckets?.some((b) => b.name === bucket);

            if (!exists) {
                const { error } = await this.client.storage.createBucket(bucket, {
                    public: true, // Make files public by default for easy access
                    fileSizeLimit: 52428800, // 50MB limit
                });

                if (error && !error.message.includes('already exists')) {
                    this.logger.error(`Failed to create bucket ${bucket}: ${error.message}`);
                } else {
                    this.logger.log(`Created storage bucket: ${bucket}`);
                }
            }
        } catch (error) {
            // Bucket might already exist, ignore
        }
    }

    /**
     * List files in a bucket path
     */
    async listFiles(bucket: string, path: string = ''): Promise<string[]> {
        if (!this.client) {
            return [];
        }

        try {
            const { data, error } = await this.client.storage
                .from(bucket)
                .list(path);

            if (error) {
                this.logger.error(`List error: ${error.message}`);
                return [];
            }

            return data?.map((file) => file.name) || [];
        } catch (error) {
            this.logger.error(`Failed to list files: ${error}`);
            return [];
        }
    }
}
