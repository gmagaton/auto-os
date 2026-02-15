import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export interface OrdemEmailData {
  clienteNome: string;
  clienteEmail: string;
  veiculoPlaca: string;
  veiculoModelo: string;
  valorTotal: number;
  portalLink: string;
  itens: Array<{ nome: string; valor: number }>;
  empresaNome?: string;
}

@Injectable()
export class EmailService {
  private readonly frontendUrl: string;

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:4200');
  }

  async enviarOrcamento(data: OrdemEmailData): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: data.clienteEmail,
        subject: `Orcamento para ${data.veiculoPlaca} - ${data.empresaNome || 'AutoOS'}`,
        template: 'orcamento',
        context: {
          clienteNome: data.clienteNome,
          veiculoPlaca: data.veiculoPlaca,
          veiculoModelo: data.veiculoModelo,
          valorTotal: data.valorTotal.toFixed(2),
          portalLink: data.portalLink,
          itens: data.itens.map((i) => ({
            ...i,
            valor: i.valor.toFixed(2),
          })),
        },
      });
    } catch (error) {
      console.error('Erro ao enviar email de orcamento:', error);
      // Nao lancar erro para nao bloquear a operacao principal
    }
  }

  async enviarAprovacao(data: OrdemEmailData): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: data.clienteEmail,
        subject: `Orcamento Aprovado - ${data.veiculoPlaca} - ${data.empresaNome || 'AutoOS'}`,
        template: 'aprovado',
        context: {
          clienteNome: data.clienteNome,
          veiculoPlaca: data.veiculoPlaca,
          veiculoModelo: data.veiculoModelo,
          valorTotal: data.valorTotal.toFixed(2),
          portalLink: data.portalLink,
        },
      });
    } catch (error) {
      console.error('Erro ao enviar email de aprovacao:', error);
    }
  }

  async enviarFinalizado(data: OrdemEmailData): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: data.clienteEmail,
        subject: `Servico Finalizado - ${data.veiculoPlaca} - ${data.empresaNome || 'AutoOS'}`,
        template: 'finalizado',
        context: {
          clienteNome: data.clienteNome,
          veiculoPlaca: data.veiculoPlaca,
          veiculoModelo: data.veiculoModelo,
          portalLink: data.portalLink,
        },
      });
    } catch (error) {
      console.error('Erro ao enviar email de finalizacao:', error);
    }
  }
}
