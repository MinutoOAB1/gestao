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
        const decoded: any = jwt.decode(token);
        if (decoded && decoded.tenantId) {
          tenantId = decoded.tenantId;
        }
      } catch (err) {
        // Ignore decode errors, AuthGuard will handle verification
      }
    }

    // Run the rest of the request within the tenant context
    this.tenantContext.runWithTenant(tenantId, false, () => next());
  }
}
