import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from './tenant-context.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    let tenantId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        // 🔒 SEGURANÇA [VULN-2]: Valida rigorosamente a assinatura do token usando a chave secreta.
        // Evita a extração de tenantId de JWTs forjados ou não assinados (CWE-287 / Anti-padrão A2).
        const secret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'super-secret' : null);
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is missing in production!');
        }
        
        const decoded: any = jwt.verify(token, secret);
        if (decoded && decoded.tenantId) {
          tenantId = decoded.tenantId;
        }
      } catch (err) {
        // Log de aviso de segurança para auditorias e monitoramento
        console.warn(`[SECURITY WARN] Tenant context forgery or invalid JWT attempt: ${err.message}`);
      }
    }

    // Run the rest of the request within the tenant context
    this.tenantContext.runWithTenant(tenantId, false, () => next());
  }
}
