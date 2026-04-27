import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

@Injectable()
export class SecurityService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly key: Buffer;

    constructor(private configService: ConfigService) {
        const secret = this.configService.get<string>('ENCRYPTION_KEY') || 'default-secret-key-change-it-in-production-32-chars';
        // Ensure the key is exactly 32 bytes
        this.key = createHash('sha256').update(secret).digest();
    }

    /**
     * Encrypts a string using AES-256-GCM
     * @param text The text to encrypt
     * @returns Encrypted string in format iv:tag:content
     */
    encrypt(text: string): string {
        if (!text) return text;

        const iv = randomBytes(12);
        const cipher = createCipheriv(this.algorithm, this.key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const tag = cipher.getAuthTag();

        return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    }

    /**
     * Decrypts a string using AES-256-GCM
     * If the string is not encrypted (doesn't match format), returns original text.
     * @param hash The encrypted string in format iv:tag:content
     * @returns Decrypted string or original text if not encrypted
     */
    decrypt(hash: string): string {
        if (!hash || typeof hash !== 'string') return hash;

        const parts = hash.split(':');
        if (parts.length !== 3) return hash; // Not our format, probably plain text

        try {
            const [ivHex, tagHex, encryptedHex] = parts;
            const iv = Buffer.from(ivHex, 'hex');
            const tag = Buffer.from(tagHex, 'hex');
            
            const decipher = createDecipheriv(this.algorithm, this.key, iv);
            decipher.setAuthTag(tag);

            let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            // If decryption fails, it might be plain text that looks like our format
            // or encrypted with a different key. Returning original for safety.
            return hash;
        }
    }
}
