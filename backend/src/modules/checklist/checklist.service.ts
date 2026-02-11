import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateItemChecklistDto } from './dto/create-item-checklist.dto';
import { UpdateItemChecklistDto } from './dto/update-item-checklist.dto';
import { PreencherChecklistDto } from './dto/preencher-checklist.dto';

@Injectable()
export class ChecklistService {
  constructor(private prisma: PrismaService) {}

  // === ITENS CONFIG ===

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

  // === CHECKLIST PREENCHIDO ===

  async preencherChecklist(ordemId: string, dto: PreencherChecklistDto, usuarioId: string) {
    // Verificar se ordem existe
    const ordem = await this.prisma.ordemServico.findUnique({
      where: { id: ordemId },
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

    // Get filled items for this order
    const preenchidos = await this.prisma.checklistPreenchido.findMany({
      where: { ordemId },
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

  async getChecklistByOrdemToken(token: string) {
    const ordem = await this.prisma.ordemServico.findUnique({
      where: { token },
      select: { id: true },
    });

    if (!ordem) {
      throw new NotFoundException('Ordem nao encontrada');
    }

    return this.getChecklistByOrdem(ordem.id);
  }
}
