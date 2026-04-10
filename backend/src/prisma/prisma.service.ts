import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly tenantContext: TenantContextService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();

    // Middleware to set tenant context and bypass status in PostgreSQL session
    // Optimized for connection poolers (Transaction mode) by ensuring SET commands are sent
    this.$use(async (params, next) => {
      // Prevent infinite recursion for RLS setup itself
      if (params.action === 'executeRaw' || params.action === 'queryRaw') {
        return next(params);
      }

      const tenantId = this.tenantContext.getTenantId();
      const bypass = this.tenantContext.isBypassed();
      
      try {
        // Use a single multi-statement command to increase chance of keeping the same connection
        // in pooled environments like Supabase Transaction Mode.
        let sql = '';
        if (bypass) {
          sql += "SET app.bypass_rls = 'on'; ";
        } else {
          sql += "SET app.bypass_rls = 'off'; ";
        }

        if (tenantId) {
          sql += `SET app.current_tenant_id = '${tenantId}';`;
        } else {
          sql += "RESET app.current_tenant_id;";
        }

        await this.$executeRawUnsafe(sql);
      } catch (error) {
        // Logging error but not blocking the query
        // console.error('Error setting RLS context:', error);
      }

      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
