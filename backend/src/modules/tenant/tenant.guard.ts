import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.papel === 'SUPERADMIN') {
      // Resolve empresa slug from header so TenantService can use the correct empresaId
      const slug = request.headers['x-empresa-slug'] as string;
      if (slug) {
        const empresa = await this.prisma.empresa.findUnique({
          where: { slug },
          select: { id: true },
        });
        if (empresa) {
          request.tenantEmpresaId = empresa.id;
        }
      }
      return true;
    }

    if (!user?.empresaId) {
      throw new ForbiddenException('Usuário não vinculado a uma empresa');
    }

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: user.empresaId },
    });

    if (!empresa || empresa.status !== 'ATIVA') {
      throw new ForbiddenException('Empresa inativa ou suspensa');
    }

    if (empresa.dataVencimento && new Date(empresa.dataVencimento) < new Date()) {
      throw new ForbiddenException('Plano vencido');
    }

    return true;
  }
}
