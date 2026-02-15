import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { ConfigService } from '@nestjs/config';
import { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('pdfmake/js/Printer').default;

@Injectable()
export class RelatoriosService {
  private printer: InstanceType<typeof PdfPrinter>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
    private readonly configService: ConfigService,
  ) {
    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };
    this.printer = new PdfPrinter(fonts);
  }

  async gerarOrcamentoPdf(ordemId: string): Promise<Buffer> {
    const ordem = await this.prisma.ordemServico.findFirst({
      where: { id: ordemId, empresaId: this.tenant.empresaId },
      include: {
        veiculo: {
          include: {
            cliente: true,
            modelo: { include: { fabricante: true } },
          },
        },
        itens: { include: { servico: true } },
        empresa: true,
      },
    });

    if (!ordem) {
      throw new NotFoundException('Ordem não encontrada');
    }

    const oficinaNome = ordem.empresa?.nome || this.configService.get('OFICINA_NOME', 'AutoOS');
    const oficinaEndereco = ordem.empresa?.endereco ?? this.configService.get('OFICINA_ENDERECO', '') ?? '';
    const oficinaTelefone = ordem.empresa?.telefone ?? this.configService.get('OFICINA_TELEFONE', '') ?? '';
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:4200');

    // Build vehicle info rows
    const veiculoRows: TableCell[][] = [
      [
        'Modelo:',
        `${ordem.veiculo.modelo.fabricante.nome} ${ordem.veiculo.modelo.nome}`,
      ],
      ['Placa:', ordem.veiculo.placa],
      ['Cor:', ordem.veiculo.cor],
    ];
    if (ordem.veiculo.ano) {
      veiculoRows.push(['Ano:', ordem.veiculo.ano.toString()]);
    }

    // Build service rows
    const servicoRows: TableCell[][] = ordem.itens.map((item) => [
      item.servico.nome,
      item.servico.tipo,
      {
        text: Number(item.valor).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        alignment: 'right' as const,
      },
    ]);

    const content: Content[] = [
      // Cabeçalho
      {
        columns: [
          {
            text: oficinaNome,
            style: 'header',
            width: '*',
          },
          {
            text: `Data: ${new Date().toLocaleDateString('pt-BR')}`,
            alignment: 'right' as const,
            width: 'auto',
          },
        ],
      },
      { text: oficinaEndereco, style: 'subheader', margin: [0, 0, 0, 0] },
      { text: oficinaTelefone, style: 'subheader', margin: [0, 0, 0, 10] },
      {
        text: `ORÇAMENTO #${ordem.id.slice(-6).toUpperCase()}`,
        style: 'title',
        margin: [0, 10, 0, 20],
      },

      // Cliente
      { text: 'CLIENTE', style: 'sectionHeader' },
      {
        table: {
          widths: ['auto', '*'],
          body: [
            ['Nome:', ordem.veiculo.cliente.nome],
            ['Telefone:', ordem.veiculo.cliente.telefone],
          ],
        },
        layout: 'noBorders',
        margin: [0, 5, 0, 15],
      },

      // Veículo
      { text: 'VEÍCULO', style: 'sectionHeader' },
      {
        table: {
          widths: ['auto', '*'],
          body: veiculoRows,
        },
        layout: 'noBorders',
        margin: [0, 5, 0, 15],
      },

      // Serviços
      { text: 'SERVIÇOS', style: 'sectionHeader' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: [
            [
              { text: 'Descrição', style: 'tableHeader' },
              { text: 'Tipo', style: 'tableHeader' },
              { text: 'Valor', style: 'tableHeader', alignment: 'right' as const },
            ],
            ...servicoRows,
          ],
        },
        margin: [0, 5, 0, 10],
      },

      // Total
      {
        columns: [
          { text: '', width: '*' },
          {
            text: `TOTAL: ${Number(ordem.valorTotal).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}`,
            style: 'total',
            width: 'auto',
          },
        ],
        margin: [0, 10, 0, 20],
      },

      // Rodapé
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }] },
      {
        text: 'Validade: 15 dias',
        style: 'footer',
        margin: [0, 10, 0, 5],
      },
      {
        text: `Aprovação pelo portal: ${frontendUrl}/portal/${ordem.token}`,
        style: 'footer',
      },
    ];

    const docDefinition: TDocumentDefinitions = {
      defaultStyle: { font: 'Helvetica' },
      content,
      styles: {
        header: { fontSize: 18, bold: true },
        subheader: { fontSize: 10, color: '#666666' },
        title: { fontSize: 16, bold: true, alignment: 'center' },
        sectionHeader: { fontSize: 12, bold: true, fillColor: '#eeeeee', margin: [0, 5, 0, 5] },
        tableHeader: { bold: true, fillColor: '#eeeeee' },
        total: { fontSize: 14, bold: true },
        footer: { fontSize: 9, color: '#666666' },
      },
    };

    const pdfDoc = await this.printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);

      pdfDoc.end();
    });
  }
}
