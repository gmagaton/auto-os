import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { AssinaturasService } from '../assinaturas/assinaturas.service';
import { StatusOS } from '../../../generated/prisma/enums';
import { EmailService, OrdemEmailData } from '../email/email.service';
import { CreateOrdemDto } from './dto/create-ordem.dto';
import { UpdateOrdemDto } from './dto/update-ordem.dto';
import { CreateFotoDto } from './dto/create-foto.dto';
import { FiltroOrdensDto } from './dto/filtro-ordens.dto';

@Injectable()
export class OrdensService {
  private readonly frontendUrl: string;

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
    private tenant: TenantService,
    private assinaturasService: AssinaturasService,
  ) {
    this.frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:4200');
  }

  private getEmailData(ordem: any): OrdemEmailData | null {
    if (!ordem.veiculo?.cliente?.email) return null;

    return {
      clienteNome: ordem.veiculo.cliente.nome,
      clienteEmail: ordem.veiculo.cliente.email,
      veiculoPlaca: ordem.veiculo.placa,
      veiculoModelo: `${ordem.veiculo.modelo?.fabricante?.nome || ''} ${ordem.veiculo.modelo?.nome || ''}`.trim(),
      valorTotal: Number(ordem.valorTotal),
      portalLink: `${this.frontendUrl}/portal/${ordem.token}`,
      itens: ordem.itens?.map((i: any) => ({
        nome: i.servico.nome,
        valor: Number(i.valor),
      })) || [],
      empresaNome: ordem.empresa?.nome,
    };
  }

  private async registrarHistorico(
    ordemId: string,
    statusDe: StatusOS | null,
    statusPara: StatusOS,
    usuarioId: string | null,
    empresaId: string,
  ): Promise<void> {
    await this.prisma.historicoStatus.create({
      data: {
        ordemId,
        statusDe,
        statusPara,
        usuarioId,
        empresaId,
      },
    });
  }

  async findAll(filtros: FiltroOrdensDto) {
    const { status, inicio, fim, clienteId, placa, page = 1, limit = 20 } = filtros;

    const where: any = {
      empresaId: this.tenant.empresaId,
    };

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (inicio || fim) {
      where.criadoEm = {};
      if (inicio) where.criadoEm.gte = new Date(inicio);
      if (fim) {
        const fimDate = new Date(fim);
        fimDate.setHours(23, 59, 59, 999);
        where.criadoEm.lte = fimDate;
      }
    }

    if (clienteId) {
      where.veiculo = { clienteId };
    }

    if (placa) {
      where.OR = [
        { veiculo: { placa: { contains: placa, mode: 'insensitive' } } },
        { veiculo: { cliente: { nome: { contains: placa, mode: 'insensitive' } } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.ordemServico.findMany({
        where,
        select: {
          id: true,
          token: true,
          status: true,
          valorTotal: true,
          dataAgendada: true,
          criadoEm: true,
          atualizadoEm: true,
          veiculo: {
            select: {
              id: true,
              placa: true,
              cor: true,
              modelo: {
                select: {
                  id: true,
                  nome: true,
                  fabricante: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },
                },
              },
              cliente: {
                select: {
                  id: true,
                  nome: true,
                  telefone: true,
                },
              },
            },
          },
          usuario: {
            select: {
              id: true,
              nome: true,
            },
          },
          itens: {
            select: {
              id: true,
              valor: true,
              servico: {
                select: {
                  id: true,
                  nome: true,
                  tipo: true,
                },
              },
            },
          },
          fotos: {
            select: {
              id: true,
              url: true,
              tipo: true,
              criadoEm: true,
            },
          },
        },
        orderBy: { criadoEm: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ordemServico.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const ordem = await this.prisma.ordemServico.findFirst({
      where: { id, empresaId: this.tenant.empresaId },
      select: {
        id: true,
        token: true,
        status: true,
        valorTotal: true,
        dataAgendada: true,
        aprovadoEm: true,
        criadoEm: true,
        atualizadoEm: true,
        veiculo: {
          select: {
            id: true,
            placa: true,
            cor: true,
            ano: true,
            modelo: {
              select: {
                id: true,
                nome: true,
                fabricante: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
            cliente: {
              select: {
                id: true,
                nome: true,
                telefone: true,
                email: true,
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        itens: {
          select: {
            id: true,
            valor: true,
            servico: {
              select: {
                id: true,
                nome: true,
                tipo: true,
                valor: true,
              },
            },
          },
        },
        fotos: {
          select: {
            id: true,
            url: true,
            tipo: true,
            criadoEm: true,
          },
        },
      },
    });

    if (!ordem) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    return ordem;
  }

  async findByPeriodo(inicio: string, fim: string) {
    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);
    dataFim.setHours(23, 59, 59, 999);

    return this.prisma.ordemServico.findMany({
      where: {
        empresaId: this.tenant.empresaId,
        dataAgendada: {
          gte: dataInicio,
          lte: dataFim,
        },
        status: {
          in: ['AGENDADO', 'EM_ANDAMENTO'],
        },
      },
      select: {
        id: true,
        token: true,
        status: true,
        valorTotal: true,
        dataAgendada: true,
        criadoEm: true,
        veiculo: {
          select: {
            id: true,
            placa: true,
            cor: true,
            modelo: {
              select: {
                nome: true,
                fabricante: {
                  select: { nome: true },
                },
              },
            },
            cliente: {
              select: {
                id: true,
                nome: true,
                telefone: true,
              },
            },
          },
        },
      },
      orderBy: { dataAgendada: 'asc' },
    });
  }

  async findByToken(token: string) {
    const ordem = await this.prisma.ordemServico.findUnique({
      where: { token },
      select: {
        id: true,
        token: true,
        status: true,
        valorTotal: true,
        dataAgendada: true,
        aprovadoEm: true,
        criadoEm: true,
        atualizadoEm: true,
        empresa: {
          select: {
            nome: true,
            logoUrl: true,
            telefone: true,
            endereco: true,
          },
        },
        veiculo: {
          select: {
            id: true,
            placa: true,
            cor: true,
            ano: true,
            modelo: {
              select: {
                id: true,
                nome: true,
                fabricante: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
            cliente: {
              select: {
                id: true,
                nome: true,
                telefone: true,
                email: true,
              },
            },
          },
        },
        itens: {
          select: {
            id: true,
            valor: true,
            servico: {
              select: {
                id: true,
                nome: true,
                tipo: true,
              },
            },
          },
        },
        fotos: {
          select: {
            id: true,
            url: true,
            tipo: true,
            criadoEm: true,
          },
        },
      },
    });

    if (!ordem) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    return ordem;
  }

  async create(dto: CreateOrdemDto, usuarioId: string) {
    // Check subscription
    const assinatura = await this.assinaturasService.getAssinaturaAtiva(this.tenant.empresaId);
    if (!assinatura) {
      throw new ForbiddenException('Assinatura vencida ou inexistente');
    }
    if (assinatura.status === 'VENCIDA') {
      throw new ForbiddenException('Assinatura vencida');
    }
    if (assinatura.status === 'TRIAL' && new Date(assinatura.dataFim) < new Date()) {
      throw new ForbiddenException('Periodo de teste expirado');
    }

    // Calculate total value
    const valorTotal = dto.itens.reduce(
      (sum, item) => sum + item.valor,
      0,
    );

    const ordem = await this.prisma.ordemServico.create({
      data: {
        veiculoId: dto.veiculoId,
        usuarioId,
        valorTotal: (valorTotal),
        dataAgendada: dto.dataAgendada ? new Date(dto.dataAgendada) : null,
        empresaId: this.tenant.empresaId,
        itens: {
          create: dto.itens.map((item) => ({
            servicoId: item.servicoId,
            valor: (item.valor),
          })),
        },
      },
      select: {
        id: true,
        token: true,
        status: true,
        valorTotal: true,
        dataAgendada: true,
        criadoEm: true,
        veiculo: {
          select: {
            id: true,
            placa: true,
            modelo: {
              select: {
                id: true,
                nome: true,
                fabricante: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
            cliente: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
          },
        },
        itens: {
          select: {
            id: true,
            valor: true,
            servico: {
              select: {
                id: true,
                nome: true,
                tipo: true,
              },
            },
          },
        },
        empresa: {
          select: { nome: true },
        },
      },
    });

    // Registrar histórico de criação
    await this.registrarHistorico(ordem.id, null, 'AGUARDANDO', usuarioId, this.tenant.empresaId);

    // Enviar email de orcamento
    const emailData = this.getEmailData(ordem);
    if (emailData) {
      this.emailService.enviarOrcamento(emailData);
    }

    return ordem;
  }

  async update(id: string, dto: UpdateOrdemDto, usuarioId: string | null = null) {
    // Get current order status before updating
    const ordemAtual = await this.findOne(id);

    // If items are being updated, recalculate total value
    if (dto.itens) {
      const valorTotal = dto.itens.reduce(
        (sum, item) => sum + item.valor,
        0,
      );

      // Delete existing items and create new ones
      await this.prisma.itemOrcamento.deleteMany({
        where: { ordemId: id },
      });

      const ordem = await this.prisma.ordemServico.update({
        where: { id },
        data: {
          status: dto.status,
          dataAgendada: dto.dataAgendada ? new Date(dto.dataAgendada) : undefined,
          valorTotal: (valorTotal),
          itens: {
            create: dto.itens.map((item) => ({
              servicoId: item.servicoId,
              valor: (item.valor),
            })),
          },
        },
        select: {
          id: true,
          token: true,
          status: true,
          valorTotal: true,
          dataAgendada: true,
          criadoEm: true,
          atualizadoEm: true,
          veiculo: {
            select: {
              id: true,
              placa: true,
              modelo: {
                select: {
                  id: true,
                  nome: true,
                  fabricante: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },
                },
              },
              cliente: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
          usuario: {
            select: {
              id: true,
              nome: true,
            },
          },
          itens: {
            select: {
              id: true,
              valor: true,
              servico: {
                select: {
                  id: true,
                  nome: true,
                  tipo: true,
                },
              },
            },
          },
          fotos: {
            select: {
              id: true,
              url: true,
              tipo: true,
              criadoEm: true,
            },
          },
          empresa: {
            select: { nome: true },
          },
        },
      });

      // Registrar histórico se status mudou
      if (dto.status && dto.status !== ordemAtual.status) {
        await this.registrarHistorico(id, ordemAtual.status as StatusOS, dto.status as StatusOS, usuarioId, this.tenant.empresaId);
      }

      return ordem;
    }

    // Update without changing items
    const ordem = await this.prisma.ordemServico.update({
      where: { id },
      data: {
        status: dto.status,
        dataAgendada: dto.dataAgendada ? new Date(dto.dataAgendada) : undefined,
      },
      select: {
        id: true,
        token: true,
        status: true,
        valorTotal: true,
        dataAgendada: true,
        criadoEm: true,
        atualizadoEm: true,
        veiculo: {
          select: {
            id: true,
            placa: true,
            modelo: {
              select: {
                id: true,
                nome: true,
                fabricante: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
            cliente: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
          },
        },
        itens: {
          select: {
            id: true,
            valor: true,
            servico: {
              select: {
                id: true,
                nome: true,
                tipo: true,
              },
            },
          },
        },
        fotos: {
          select: {
            id: true,
            url: true,
            tipo: true,
            criadoEm: true,
          },
        },
        empresa: {
          select: { nome: true },
        },
      },
    });

    // Registrar histórico se status mudou
    if (dto.status && dto.status !== ordemAtual.status) {
      await this.registrarHistorico(id, ordemAtual.status as StatusOS, dto.status as StatusOS, usuarioId, this.tenant.empresaId);
    }

    // Enviar email de finalizacao se status mudou para FINALIZADO
    if (dto.status === 'FINALIZADO') {
      const emailData = this.getEmailData(ordem);
      if (emailData) {
        this.emailService.enviarFinalizado(emailData);
      }
    }

    return ordem;
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.ordemServico.delete({
      where: { id },
    });
  }

  async addFoto(ordemId: string, dto: CreateFotoDto) {
    await this.findOne(ordemId);

    return this.prisma.foto.create({
      data: {
        url: dto.url,
        tipo: dto.tipo,
        ordemId,
        empresaId: this.tenant.empresaId,
      },
      select: {
        id: true,
        url: true,
        tipo: true,
        criadoEm: true,
      },
    });
  }

  async removeFoto(fotoId: string) {
    const foto = await this.prisma.foto.findFirst({
      where: { id: fotoId, empresaId: this.tenant.empresaId },
    });

    if (!foto) {
      throw new NotFoundException('Foto não encontrada');
    }

    return this.prisma.foto.delete({
      where: { id: fotoId },
    });
  }

  async getHistorico(ordemId: string) {
    // Validate that the ordem belongs to this tenant
    await this.findOne(ordemId);

    return this.prisma.historicoStatus.findMany({
      where: { ordemId, empresaId: this.tenant.empresaId },
      include: {
        usuario: {
          select: { id: true, nome: true },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async aprovar(id: string, token: string) {
    const ordemCheck = await this.prisma.ordemServico.findUnique({
      where: { id },
    });

    if (!ordemCheck) {
      throw new NotFoundException('Ordem de servico nao encontrada');
    }

    if (ordemCheck.token !== token) {
      throw new BadRequestException('Token invalido');
    }

    if (ordemCheck.status !== 'AGUARDANDO') {
      throw new BadRequestException('Ordem de servico ja foi processada');
    }

    const ordem = await this.prisma.ordemServico.update({
      where: { id },
      data: {
        status: 'APROVADO',
        aprovadoEm: new Date(),
      },
      include: {
        veiculo: {
          include: {
            cliente: true,
            modelo: { include: { fabricante: true } },
          },
        },
        itens: { include: { servico: true } },
        empresa: { select: { nome: true } },
      },
    });

    // Registrar histórico (usuarioId = null indica aprovação pelo cliente)
    await this.registrarHistorico(ordem.id, 'AGUARDANDO', 'APROVADO', null, ordemCheck.empresaId);

    // Enviar email de aprovacao
    const emailData = this.getEmailData(ordem);
    if (emailData) {
      this.emailService.enviarAprovacao(emailData);
    }

    return {
      id: ordem.id,
      token: ordem.token,
      status: ordem.status,
      valorTotal: ordem.valorTotal,
      dataAgendada: ordem.dataAgendada,
      aprovadoEm: ordem.aprovadoEm,
      criadoEm: ordem.criadoEm,
    };
  }
}
