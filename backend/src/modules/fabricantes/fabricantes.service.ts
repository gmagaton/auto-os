import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFabricanteDto } from './dto/create-fabricante.dto';
import { UpdateFabricanteDto } from './dto/update-fabricante.dto';

@Injectable()
export class FabricantesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.fabricante.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        ativo: true,
        criadoEm: true,
        modelos: {
          where: { ativo: true },
          select: {
            id: true,
            nome: true,
            ativo: true,
            criadoEm: true,
          },
          orderBy: { nome: 'asc' },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const fabricante = await this.prisma.fabricante.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        ativo: true,
        criadoEm: true,
        modelos: {
          where: { ativo: true },
          select: {
            id: true,
            nome: true,
            ativo: true,
            criadoEm: true,
          },
          orderBy: { nome: 'asc' },
        },
      },
    });

    if (!fabricante) {
      throw new NotFoundException('Fabricante não encontrado');
    }

    return fabricante;
  }

  async create(dto: CreateFabricanteDto) {
    const existe = await this.prisma.fabricante.findUnique({
      where: { nome: dto.nome },
    });

    if (existe) {
      throw new ConflictException('Fabricante já cadastrado');
    }

    return this.prisma.fabricante.create({
      data: {
        nome: dto.nome,
      },
      select: {
        id: true,
        nome: true,
        ativo: true,
        criadoEm: true,
      },
    });
  }

  async update(id: string, dto: UpdateFabricanteDto) {
    await this.findOne(id);

    if (dto.nome) {
      const existe = await this.prisma.fabricante.findFirst({
        where: {
          nome: dto.nome,
          NOT: { id },
        },
      });

      if (existe) {
        throw new ConflictException('Fabricante já cadastrado');
      }
    }

    return this.prisma.fabricante.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        nome: true,
        ativo: true,
        criadoEm: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const modelosCount = await this.prisma.modelo.count({
      where: { fabricanteId: id },
    });

    if (modelosCount > 0) {
      throw new BadRequestException(
        'Não é possível excluir fabricante com modelos vinculados',
      );
    }

    return this.prisma.fabricante.delete({
      where: { id },
    });
  }
}
