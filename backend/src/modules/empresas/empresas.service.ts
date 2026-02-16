import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { StatusEmpresa } from '../../../generated/prisma/enums';

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService) {}

  async findAll(busca?: string) {
    return this.prisma.empresa.findMany({
      where: busca ? {
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { slug: { contains: busca, mode: 'insensitive' } },
          { email: { contains: busca, mode: 'insensitive' } },
        ],
      } : undefined,
      select: {
        id: true,
        nome: true,
        slug: true,
        status: true,
        criadoEm: true,
        _count: {
          select: {
            usuarios: true,
            clientes: true,
            ordens: true,
          },
        },
        assinaturas: {
          where: { status: { in: ['TRIAL', 'ATIVA'] } },
          orderBy: { criadoEm: 'desc' },
          take: 1,
          select: {
            status: true,
            dataFim: true,
            plano: { select: { nome: true } },
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        slug: true,
        logoUrl: true,
        telefone: true,
        email: true,
        endereco: true,
        status: true,
        criadoEm: true,
        atualizadoEm: true,
        _count: {
          select: {
            usuarios: true,
            clientes: true,
            veiculos: true,
            ordens: true,
            servicos: true,
          },
        },
        assinaturas: {
          where: { status: { in: ['TRIAL', 'ATIVA'] } },
          orderBy: { criadoEm: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            dataInicio: true,
            dataFim: true,
            plano: { select: { id: true, nome: true, slug: true, maxUsuarios: true, preco: true } },
          },
        },
      },
    });

    if (!empresa) {
      throw new NotFoundException('Empresa nao encontrada');
    }

    return empresa;
  }

  async getStats(id: string) {
    await this.findOne(id);

    const [usuarios, ordens, faturamento] = await Promise.all([
      this.prisma.usuario.count({ where: { empresaId: id } }),
      this.prisma.ordemServico.count({ where: { empresaId: id } }),
      this.prisma.ordemServico.aggregate({
        where: { empresaId: id, status: 'FINALIZADO' },
        _sum: { valorTotal: true },
      }),
    ]);

    return {
      usuarios,
      ordens,
      faturamento: Number(faturamento._sum.valorTotal || 0),
    };
  }

  async create(dto: CreateEmpresaDto) {
    const slug = dto.slug || this.generateSlug(dto.nome);

    // Check slug uniqueness
    const existing = await this.prisma.empresa.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Slug ja em uso');
    }

    return this.prisma.empresa.create({
      data: {
        nome: dto.nome,
        slug,
        telefone: dto.telefone,
        email: dto.email,
        endereco: dto.endereco,
        logoUrl: dto.logoUrl,
      },
    });
  }

  async update(id: string, dto: UpdateEmpresaDto) {
    await this.findOne(id);

    if (dto.slug) {
      const existing = await this.prisma.empresa.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Slug ja em uso');
      }
    }

    return this.prisma.empresa.update({
      where: { id },
      data: dto,
    });
  }

  async updateStatus(id: string, status: StatusEmpresa) {
    await this.findOne(id);

    return this.prisma.empresa.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Check if empresa has any data
    const counts = await this.prisma.empresa.findUnique({
      where: { id },
      select: {
        _count: {
          select: { usuarios: true, ordens: true },
        },
      },
    });

    if (counts && (counts._count.usuarios > 0 || counts._count.ordens > 0)) {
      throw new ConflictException('Nao e possivel excluir empresa com dados vinculados');
    }

    return this.prisma.empresa.delete({ where: { id } });
  }

  async getDashboardStats() {
    const now = new Date();
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    const seteDiasFrente = new Date();
    seteDiasFrente.setDate(seteDiasFrente.getDate() + 7);

    const [ativas, trial, vencidas, mrrResult, vencimentosProximos, ultimosCadastros] = await Promise.all([
      // Count active subscriptions
      this.prisma.assinatura.count({
        where: { status: 'ATIVA' },
      }),
      // Count trial subscriptions still valid
      this.prisma.assinatura.count({
        where: { status: 'TRIAL', dataFim: { gt: now } },
      }),
      // Count expired subscriptions
      this.prisma.assinatura.count({
        where: { status: 'VENCIDA' },
      }),
      // MRR: sum of prices for active subscriptions
      this.prisma.assinatura.findMany({
        where: { status: 'ATIVA' },
        include: { plano: { select: { preco: true } } },
      }),
      // Subscriptions expiring in next 7 days
      this.prisma.assinatura.findMany({
        where: {
          status: { in: ['TRIAL', 'ATIVA'] },
          dataFim: { gte: now, lte: seteDiasFrente },
        },
        include: {
          empresa: { select: { id: true, nome: true, slug: true } },
          plano: { select: { nome: true } },
        },
        orderBy: { dataFim: 'asc' },
      }),
      // Companies created in last 7 days
      this.prisma.empresa.findMany({
        where: { criadoEm: { gte: seteDiasAtras } },
        select: {
          id: true,
          nome: true,
          slug: true,
          criadoEm: true,
          _count: { select: { usuarios: true } },
        },
        orderBy: { criadoEm: 'desc' },
      }),
    ]);

    const mrr = mrrResult.reduce((sum, a) => sum + Number(a.plano.preco), 0);

    return {
      ativas,
      trial,
      vencidas,
      mrr,
      vencimentosProximos,
      ultimosCadastros,
    };
  }

  private generateSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
