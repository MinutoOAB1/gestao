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
      
      if (!bypass || tenantId) {
        try {
          // IMPORTANT: We use SET LOCAL so the setting only lasts for the current transaction.
          // This is critical for connection poolers (PgBouncer/Supabase Pooler).
          if (bypass) {
            await this.$executeRawUnsafe("SET LOCAL app.bypass_rls = 'on';");
          } else {
            await this.$executeRawUnsafe("SET LOCAL app.bypass_rls = 'off';");
          }

          if (tenantId) {
            await this.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId}';`);
          } else {
            await this.$executeRawUnsafe("SET LOCAL app.current_tenant_id = '';");
          }
        } catch (error) {
          console.error('RLS CONTEXT SETUP ERROR:', error.message);
        }
      }

      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
