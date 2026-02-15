import { Injectable, Inject, Scope, ForbiddenException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class TenantService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  get empresaId(): string {
    const id = (this.request as any).user?.empresaId;
    if (!id) {
      throw new ForbiddenException('Usuário não vinculado a uma empresa');
    }
    return id;
  }

  get isSuperAdmin(): boolean {
    return (this.request as any).user?.papel === 'SUPERADMIN';
  }
}
