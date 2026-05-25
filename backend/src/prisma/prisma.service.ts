import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly tenantContext: TenantContextService) {
    let dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl && dbUrl.includes(':6543') && !dbUrl.includes('pgbouncer=')) {
      const separator = dbUrl.includes('?') ? '&' : '?';
      dbUrl = `${dbUrl}${separator}pgbouncer=true`;
    }
    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
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
      
      // ALWAYS set the context, even if it's empty or bypassed, to prevent connection pool leakage.
      try {
        // 🔒 SEGURANÇA [VULN-1]: Usa SELECT set_config parametrizado com queryRaw para evitar SQL Injection (CWE-89)
        // Isso previne que entradas maliciosas no tenantId injetem comandos arbitrários no banco de dados.
        const bypassVal = bypass ? 'on' : 'off';
        await this.$queryRaw`SELECT set_config('app.bypass_rls', ${bypassVal}, true);`;

        if (tenantId) {
          await this.$queryRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true);`;
        } else {
          await this.$queryRaw`SELECT set_config('app.current_tenant_id', '', true);`;
        }
      } catch (error) {
        console.error('RLS CONTEXT SETUP ERROR:', error.message);
      }

      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
