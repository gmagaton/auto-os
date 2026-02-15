import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { CreateItemChecklistDto } from './dto/create-item-checklist.dto';
import { UpdateItemChecklistDto } from './dto/update-item-checklist.dto';
import { PreencherChecklistDto } from './dto/preencher-checklist.dto';

@Injectable()
export class ChecklistService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  // === ITENS CONFIG (shared, not tenant-scoped) ===

  async findAllItens(includeInactive = false) {
    return this.prisma.itemChecklist.findMany({
      where: includeInactive ? {} : { ativo: true },
      orderBy: [{ categoria: 'asc' }, { ordem: 'asc' }],
    });
  }

  async findOneItem(id: string) {
    const item = await this.prisma.itemChecklist.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Item de checklist não encontrado');
    }

    return item;
  }

  async createItem(dto: CreateItemChecklistDto) {
    return this.prisma.itemChecklist.create({
      data: dto,
    });
  }

  async updateItem(id: string, dto: UpdateItemChecklistDto) {
    await this.findOneItem(id);

    return this.prisma.itemChecklist.update({
      where: { id },
      data: dto,
    });
  }

  async removeItem(id: string) {
    await this.findOneItem(id);

    // Soft delete - just deactivate
    return this.prisma.itemChecklist.update({
      where: { id },
      data: { ativo: false },
    });
  }

  async getCategorias() {
    const items = await this.prisma.itemChecklist.findMany({
      where: { ativo: true },
      select: { categoria: true },
      distinct: ['categoria'],
      orderBy: { categoria: 'asc' },
    });

    return items.map((i) => i.categoria);
  }

  // === CHECKLIST PREENCHIDO (tenant-scoped) ===

  async preencherChecklist(ordemId: string, dto: PreencherChecklistDto, usuarioId: string) {
    // Verificar se ordem existe and belongs to this tenant
    const ordem = await this.prisma.ordemServico.findFirst({
      where: { id: ordemId, empresaId: this.tenant.empresaId },
    });

    if (!ordem) {
      throw new NotFoundException('Ordem de servico nao encontrada');
    }

    // Upsert each item
    const results = await Promise.all(
      dto.itens.map((item) =>
        this.prisma.checklistPreenchido.upsert({
          where: {
            ordemId_itemId: {
              ordemId,
              itemId: item.itemId,
            },
          },
          update: {
            status: item.status,
            observacao: item.observacao,
            usuarioId,
          },
          create: {
            ordemId,
            itemId: item.itemId,
            status: item.status,
            observacao: item.observacao,
            usuarioId,
            empresaId: this.tenant.empresaId,
          },
          include: {
            item: true,
            usuario: {
              select: { id: true, nome: true },
            },
          },
        }),
      ),
    );

    return results;
  }

  async getChecklistByOrdem(ordemId: string) {
    // Get all active items
    const itens = await this.prisma.itemChecklist.findMany({
      where: { ativo: true },
      orderBy: [{ categoria: 'asc' }, { ordem: 'asc' }],
    });

    // Get filled items for this order, scoped to tenant
    const preenchidos = await this.prisma.checklistPreenchido.findMany({
      where: { ordemId, empresaId: this.tenant.empresaId },
      include: {
        item: true,
        usuario: {
          select: { id: true, nome: true },
        },
      },
    });

    // Map items with their status
    const preenchidosMap = new Map(preenchidos.map((p) => [p.itemId, p]));

    return itens.map((item) => ({
      item,
      preenchido: preenchidosMap.get(item.id) || null,
    }));
  }

  async getChecklistStatus(ordemId: string) {
    const total = await this.prisma.itemChecklist.count({
      where: { ativo: true },
    });

    const preenchidos = await this.prisma.checklistPreenchido.count({
      where: { ordemId, empresaId: this.tenant.empresaId },
    });

    return {
      preenchido: preenchidos >= total && total > 0,
      total,
      preenchidos,
    };
  }

  async getChecklistByOrdemToken(token: string) {
    const ordem = await this.prisma.ordemServico.findUnique({
      where: { token },
      select: { id: true, empresaId: true },
    });

    if (!ordem) {
      throw new NotFoundException('Ordem nao encontrada');
    }

    // Portal (public) path: resolve empresaId from the order itself
    const itens = await this.prisma.itemChecklist.findMany({
      where: { ativo: true },
      orderBy: [{ categoria: 'asc' }, { ordem: 'asc' }],
    });

    const preenchidos = await this.prisma.checklistPreenchido.findMany({
      where: { ordemId: ordem.id, empresaId: ordem.empresaId },
      include: {
        item: true,
        usuario: {
          select: { id: true, nome: true },
        },
      },
    });

    const preenchidosMap = new Map(preenchidos.map((p) => [p.itemId, p]));

    return itens.map((item) => ({
      item,
      preenchido: preenchidosMap.get(item.id) || null,
    }));
  }
}
