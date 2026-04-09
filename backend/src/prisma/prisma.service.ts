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
    this.$use(async (params, next) => {
      // Prevent infinite recursion for RLS setup itself
      if (params.action === 'executeRaw' || params.action === 'queryRaw') {
        return next(params);
      }

      const tenantId = this.tenantContext.getTenantId();
      const bypass = this.tenantContext.isBypassed();
      
      try {
        if (bypass) {
          await this.$executeRawUnsafe(`SET app.bypass_rls = 'on'`);
        } else {
          await this.$executeRawUnsafe(`SET app.bypass_rls = 'off'`);
        }

        if (tenantId) {
          await this.$executeRawUnsafe(`SET app.current_tenant_id = '${tenantId}'`);
        } else {
          await this.$executeRawUnsafe(`RESET app.current_tenant_id`);
        }
      } catch (error) {
        console.error('Error setting RLS context:', error);
      }

      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
