import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class TenantService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  get empresaId(): string | undefined {
    return (this.request as any).user?.empresaId;
  }

  get isSuperAdmin(): boolean {
    return (this.request as any).user?.papel === 'SUPERADMIN';
  }
}
