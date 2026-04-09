import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantStore {
  tenantId: string | null;
  bypass: boolean;
}

@Injectable()
export class TenantContextService {
  private static readonly als = new AsyncLocalStorage<TenantStore>();

  runWithTenant(tenantId: string | null, bypass: boolean = false, callback: () => any) {
    return TenantContextService.als.run({ tenantId, bypass }, callback);
  }

  getTenantId(): string | null | undefined {
    return TenantContextService.als.getStore()?.tenantId;
  }

  isBypassed(): boolean {
    return !!TenantContextService.als.getStore()?.bypass;
  }
}
