import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const fabricantesModelos = {
  Chevrolet: [
    'Onix',
    'Onix Plus',
    'Tracker',
    'Montana',
    'Spin',
    'Cruze',
    'S10',
    'Trailblazer',
    'Equinox',
    'Bolt EV',
  ],
  Fiat: [
    'Mobi',
    'Argo',
    'Cronos',
    'Pulse',
    'Fastback',
    'Strada',
    'Toro',
    'Fiorino',
    'Ducato',
  ],
  Ford: [
    'Ranger',
    'Ranger Raptor',
    'Territory',
    'Bronco',
    'Bronco Sport',
    'Mustang',
  ],
  Volkswagen: [
    'Polo',
    'Virtus',
    'Nivus',
    'T-Cross',
    'Taos',
    'Saveiro',
    'Amarok',
    'Jetta',
  ],
  Toyota: [
    'Corolla',
    'Corolla Cross',
    'Yaris',
    'Yaris Sedan',
    'Hilux',
    'SW4',
    'RAV4',
  ],
  Honda: ['City', 'City Hatch', 'Civic', 'HR-V', 'CR-V', 'ZR-V'],
  Hyundai: ['HB20', 'HB20S', 'Creta', 'Tucson', 'Santa Fe', 'Kona'],
  Nissan: ['March', 'Versa', 'Sentra', 'Kicks', 'Frontier'],
  Renault: [
    'Kwid',
    'Sandero',
    'Logan',
    'Stepway',
    'Duster',
    'Oroch',
    'Kangoo',
    'Master',
  ],
  Peugeot: ['208', '2008', '3008', '5008', 'Partner', 'Expert', 'Boxer'],
  Citroën: ['C3', 'C3 Aircross', 'C4 Cactus', 'Berlingo', 'Jumpy', 'Jumper'],
  Jeep: ['Renegade', 'Compass', 'Commander', 'Wrangler', 'Gladiator'],
  BYD: ['Dolphin', 'Dolphin Mini', 'Yuan Plus', 'Song Plus', 'Seal', 'Han'],
  GWM: ['Haval H6', 'Haval H6 GT', 'Ora 03'],
  Chery: ['Arrizo 6'],
  CaoaChery: ['Tiggo 5X', 'Tiggo 7', 'Tiggo 8'],
  JAC: ['T40', 'T50', 'T60', 'E-JS1', 'E-JS4', 'iEV330P'],
  Lexus: ['UX', 'NX', 'RX', 'ES', 'IS'],
  Mitsubishi: ['L200 Triton', 'Outlander', 'Eclipse Cross', 'Pajero Sport'],
  Subaru: ['XV', 'Forester', 'Outback'],
  Suzuki: ['Jimny', 'Jimny Sierra', 'Vitara', 'S-Cross'],
  BMW: ['118i', '320i', '330e', 'X1', 'X3', 'X5', 'iX', 'i4'],
  MercedesBenz: [
    'Classe A',
    'Classe C',
    'Classe E',
    'GLA',
    'GLB',
    'GLC',
    'GLE',
  ],
  Audi: ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron'],
  Porsche: ['Macan', 'Cayenne', 'Panamera', '911', 'Taycan'],
  Volvo: ['XC40', 'XC60', 'XC90', 'EX30', 'S60'],
  Mini: ['Cooper', 'Countryman'],
  LandRover: ['Range Rover Evoque', 'Discovery Sport', 'Defender'],
  Jaguar: ['E-Pace', 'F-Pace', 'I-Pace'],
  RAM: ['Rampage', '1500', '2500'],
};

async function main() {
  console.log('Seeding database...');

  // Criar empresa padrao
  const defaultEmpresaId = 'default-empresa';
  await prisma.empresa.upsert({
    where: { id: defaultEmpresaId },
    update: {},
    create: {
      id: defaultEmpresaId,
      nome: 'Oficina Padrao',
      slug: 'oficina-padrao',
      status: 'ATIVA',
    },
  });
  console.log('Empresa padrao criada (oficina-padrao)');

  // Criar fabricantes e modelos
  for (const [fabricanteNome, modelos] of Object.entries(fabricantesModelos)) {
    const fabricante = await prisma.fabricante.upsert({
      where: { nome: fabricanteNome },
      update: {},
      create: { nome: fabricanteNome },
    });

    for (const modeloNome of modelos) {
      await prisma.modelo.upsert({
        where: {
          fabricanteId_nome: {
            fabricanteId: fabricante.id,
            nome: modeloNome,
          },
        },
        update: {},
        create: {
          nome: modeloNome,
          fabricanteId: fabricante.id,
        },
      });
    }

    console.log(`Fabricante ${fabricanteNome}: ${modelos.length} modelos`);
  }

  // Criar usuario superadmin
  const senhaSuperHash = await bcrypt.hash('super123', 12);
  await prisma.usuario.upsert({
    where: {
      email_empresaId: {
        email: 'super@autoos.com',
        empresaId: defaultEmpresaId,
      },
    },
    update: {},
    create: {
      nome: 'Super Admin',
      email: 'super@autoos.com',
      senha: senhaSuperHash,
      papel: 'SUPERADMIN',
      empresaId: defaultEmpresaId,
    },
  });
  console.log('Usuario superadmin criado (super@autoos.com / super123)');

  // Criar usuario admin inicial
  const senhaHash = await bcrypt.hash('admin123', 12);
  await prisma.usuario.upsert({
    where: {
      email_empresaId: {
        email: 'admin@oficina.com',
        empresaId: defaultEmpresaId,
      },
    },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@oficina.com',
      senha: senhaHash,
      papel: 'ADMIN',
      empresaId: defaultEmpresaId,
    },
  });
  console.log('Usuario admin criado (admin@oficina.com / admin123)');

  // Criar serviços
  const servicos = [
    // Funilaria
    { nome: 'Funilaria P', tipo: 'SERVICO', valor: 350.00 },
    { nome: 'Funilaria M', tipo: 'SERVICO', valor: 650.00 },
    { nome: 'Funilaria G', tipo: 'SERVICO', valor: 1200.00 },
    // Martelinho de Ouro
    { nome: 'Martelinho de Ouro P', tipo: 'SERVICO', valor: 150.00 },
    { nome: 'Martelinho de Ouro M', tipo: 'SERVICO', valor: 300.00 },
    { nome: 'Martelinho de Ouro G', tipo: 'SERVICO', valor: 500.00 },
    // Pintura
    { nome: 'Pintura P', tipo: 'SERVICO', valor: 400.00 },
    { nome: 'Pintura M', tipo: 'SERVICO', valor: 800.00 },
    { nome: 'Pintura G', tipo: 'SERVICO', valor: 1500.00 },
    // Polimento
    { nome: 'Polimento Simples', tipo: 'SERVICO', valor: 200.00 },
    { nome: 'Polimento Completo', tipo: 'SERVICO', valor: 400.00 },
    { nome: 'Cristalizacao', tipo: 'SERVICO', valor: 350.00 },
    // Adicionais
    { nome: 'Alinhamento', tipo: 'ADICIONAL', valor: 80.00 },
    { nome: 'Balanceamento', tipo: 'ADICIONAL', valor: 60.00 },
    { nome: 'Higienizacao Interna', tipo: 'ADICIONAL', valor: 150.00 },
    { nome: 'Lavagem Completa', tipo: 'ADICIONAL', valor: 80.00 },
    { nome: 'Troca de Oleo', tipo: 'ADICIONAL', valor: 120.00 },
    { nome: 'Revisao Eletrica', tipo: 'ADICIONAL', valor: 200.00 },
  ];

  for (const servico of servicos) {
    const servicoId = servico.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    await prisma.servico.upsert({
      where: { id: servicoId },
      update: { valor: servico.valor },
      create: {
        id: servicoId,
        nome: servico.nome,
        tipo: servico.tipo as 'SERVICO' | 'ADICIONAL',
        valor: servico.valor,
        ativo: true,
        empresaId: defaultEmpresaId,
      },
    });
  }
  console.log(`${servicos.length} servicos criados`);

  // Criar itens de checklist
  const itensChecklist = [
    // ELÉTRICA
    { nome: 'Faróis dianteiros', categoria: 'ELÉTRICA', ordem: 1 },
    { nome: 'Lanternas traseiras', categoria: 'ELÉTRICA', ordem: 2 },
    { nome: 'Setas', categoria: 'ELÉTRICA', ordem: 3 },
    { nome: 'Luz de freio', categoria: 'ELÉTRICA', ordem: 4 },
    { nome: 'Vidros elétricos', categoria: 'ELÉTRICA', ordem: 5 },
    { nome: 'Travas elétricas', categoria: 'ELÉTRICA', ordem: 6 },
    { nome: 'Retrovisores elétricos', categoria: 'ELÉTRICA', ordem: 7 },
    // CLIMATIZAÇÃO
    { nome: 'Ar condicionado', categoria: 'CLIMATIZAÇÃO', ordem: 8 },
    { nome: 'Ventilação', categoria: 'CLIMATIZAÇÃO', ordem: 9 },
    // GERAL
    { nome: 'Buzina', categoria: 'GERAL', ordem: 10 },
    { nome: 'Limpador de para-brisa', categoria: 'GERAL', ordem: 11 },
    { nome: 'Painel sem alertas', categoria: 'GERAL', ordem: 12 },
    { nome: 'Freio de mão', categoria: 'GERAL', ordem: 13 },
    // APARÊNCIA (pré-existentes)
    { nome: 'Riscos na pintura', categoria: 'APARÊNCIA', ordem: 14 },
    { nome: 'Amassados não relacionados', categoria: 'APARÊNCIA', ordem: 15 },
    { nome: 'Para-choques', categoria: 'APARÊNCIA', ordem: 16 },
  ];

  for (const item of itensChecklist) {
    const itemId = item.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    await prisma.itemChecklist.upsert({
      where: { id: itemId },
      update: {
        nome: item.nome,
        categoria: item.categoria,
        ordem: item.ordem,
      },
      create: {
        id: itemId,
        nome: item.nome,
        categoria: item.categoria,
        ordem: item.ordem,
      },
    });
  }
  console.log(`${itensChecklist.length} itens de checklist criados`);

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
