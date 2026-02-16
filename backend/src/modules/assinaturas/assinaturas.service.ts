import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AssinaturasService {
  constructor(private prisma: PrismaService) {}

  async getAssinaturaAtiva(empresaId: string) {
    return this.prisma.assinatura.findFirst({
      where: {
        empresaId,
        status: { in: ['TRIAL', 'ATIVA'] },
      },
      include: {
        plano: true,
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async criarTrial(empresaId: string) {
    const dataFim = new Date();
    dataFim.setDate(dataFim.getDate() + 14);

    return this.prisma.assinatura.create({
      data: {
        empresaId,
        planoId: 'plano-trial',
        status: 'TRIAL',
        dataFim,
      },
    });
  }

  async renovar(empresaId: string, planoId: string, meses: number) {
    // Cancel any active subscriptions first
    await this.prisma.assinatura.updateMany({
      where: {
        empresaId,
        status: { in: ['TRIAL', 'ATIVA'] },
      },
      data: { status: 'CANCELADA' },
    });

    const dataFim = new Date();
    dataFim.setMonth(dataFim.getMonth() + meses);

    return this.prisma.assinatura.create({
      data: {
        empresaId,
        planoId,
        status: 'ATIVA',
        dataFim,
      },
      include: { plano: true },
    });
  }

  async cancelar(assinaturaId: string) {
    const assinatura = await this.prisma.assinatura.findUnique({
      where: { id: assinaturaId },
    });

    if (!assinatura) {
      throw new NotFoundException('Assinatura nao encontrada');
    }

    return this.prisma.assinatura.update({
      where: { id: assinaturaId },
      data: { status: 'CANCELADA' },
    });
  }

  async verificarVencimentos() {
    const now = new Date();

    const result = await this.prisma.assinatura.updateMany({
      where: {
        status: { in: ['TRIAL', 'ATIVA'] },
        dataFim: { lt: now },
      },
      data: { status: 'VENCIDA' },
    });

    if (result.count > 0) {
      console.log(`[Cron] ${result.count} assinatura(s) marcada(s) como VENCIDA`);
    }

    return result;
  }
}
