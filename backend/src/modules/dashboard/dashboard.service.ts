import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
  ) {}

  async getDashboard() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const empresaId = this.tenant.empresaId;

    // Contadores operacionais
    const [aguardando, aprovado, emAndamento, agendadasHoje] = await Promise.all([
      this.prisma.ordemServico.count({ where: { status: 'AGUARDANDO', empresaId } }),
      this.prisma.ordemServico.count({ where: { status: 'APROVADO', empresaId } }),
      this.prisma.ordemServico.count({ where: { status: 'EM_ANDAMENTO', empresaId } }),
      this.prisma.ordemServico.count({
        where: {
          empresaId,
          dataAgendada: { gte: hoje, lt: amanha },
          status: { in: ['APROVADO', 'EM_ANDAMENTO'] },
        },
      }),
    ]);

    // Faturamento dos últimos 6 meses
    const faturamento = await this.getFaturamentoMensal();

    // Top 5 serviços
    const servicosTop = await this.getServicosTop();

    return {
      operacional: {
        aguardando,
        aprovado,
        emAndamento,
        hoje: agendadasHoje,
      },
      faturamento,
      servicosTop,
    };
  }

  private async getFaturamentoMensal() {
    const resultado: { mes: string; total: number }[] = [];
    const hoje = new Date();
    const empresaId = this.tenant.empresaId;

    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const proximoMes = new Date(data.getFullYear(), data.getMonth() + 1, 1);

      const agregado = await this.prisma.ordemServico.aggregate({
        where: {
          empresaId,
          status: 'FINALIZADO',
          atualizadoEm: { gte: data, lt: proximoMes },
        },
        _sum: { valorTotal: true },
      });

      resultado.push({
        mes: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`,
        total: Number(agregado._sum.valorTotal || 0),
      });
    }

    return resultado;
  }

  private async getServicosTop() {
    const empresaId = this.tenant.empresaId;

    const servicos = await this.prisma.itemOrcamento.groupBy({
      by: ['servicoId'],
      where: { ordem: { empresaId } },
      _count: { servicoId: true },
      orderBy: { _count: { servicoId: 'desc' } },
      take: 5,
    });

    const servicosComNome = await Promise.all(
      servicos.map(async (s) => {
        const servico = await this.prisma.servico.findUnique({
          where: { id: s.servicoId },
          select: { nome: true },
        });
        return {
          nome: servico?.nome || 'Desconhecido',
          quantidade: s._count.servicoId,
        };
      }),
    );

    return servicosComNome;
  }
}
