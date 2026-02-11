import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    // Contadores operacionais
    const [aguardando, aprovado, emAndamento, agendadasHoje] = await Promise.all([
      this.prisma.ordemServico.count({ where: { status: 'AGUARDANDO' } }),
      this.prisma.ordemServico.count({ where: { status: 'APROVADO' } }),
      this.prisma.ordemServico.count({ where: { status: 'EM_ANDAMENTO' } }),
      this.prisma.ordemServico.count({
        where: {
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

    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const proximoMes = new Date(data.getFullYear(), data.getMonth() + 1, 1);

      const agregado = await this.prisma.ordemServico.aggregate({
        where: {
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
    const servicos = await this.prisma.itemOrcamento.groupBy({
      by: ['servicoId'],
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
