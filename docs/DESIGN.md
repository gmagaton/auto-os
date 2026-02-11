# Auto OS - Design do Sistema

**Objetivo:** Sistema de gestão para oficinas de funilaria com orçamentos, agenda e acompanhamento de serviços

---

## Visão Geral

Sistema web responsivo (PC e celular) para gestão de oficinas de funilaria. Permite cadastro de clientes, veículos, serviços, emissão de orçamentos, agendamento e acompanhamento do serviço pelo cliente através de um portal público.

### Contexto

- Internet estável na oficina
- 3-5 usuários simultâneos
- Possível evolução futura para SaaS multi-tenant

### Arquitetura Geral

```
┌─────────────────────────────────────────────────┐
│              Next.js Application                │
│  ┌─────────────────┐  ┌─────────────────────┐  │
│  │  App (Interno)  │  │  Portal do Cliente  │  │
│  │  /app/*         │  │  /cliente/[token]   │  │
│  └─────────────────┘  └─────────────────────┘  │
│  ┌─────────────────────────────────────────┐   │
│  │           API Routes (/api/*)           │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   PostgreSQL      Cloudinary       Email
   (dados)         (fotos)          (notificações)
```

### Dois Mundos

1. **App Interno** (`/app/*`) - Funcionários trabalham com login obrigatório
2. **Portal do Cliente** (`/cliente/[token]`) - Cliente acompanha via link único

---

## Stack Técnico

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| **Frontend** | Angular 17+ (standalone) | Framework robusto, TypeScript nativo, boa DX |
| **UI** | Angular Material | Componentes oficiais, Material Design, responsivo |
| **Backend** | NestJS | Arquitetura modular, similar ao Angular, TypeScript |
| **Banco** | PostgreSQL | Robusto, relacional, bom para dados estruturados |
| **ORM** | Prisma | Type-safe, migrations fáceis, boa DX |
| **Autenticação** | JWT + Passport | Padrão de mercado, stateless, escalável |
| **Upload de Fotos** | Cloudinary | Otimização automática, transformações, CDN |
| **Validação** | class-validator (NestJS) + Angular Forms | Validação em ambas as pontas |
| **Deploy** | VPS/Docker ou Railway | Flexível, controle total |

### Estrutura de Pastas

```
/auto-os
├── /backend                    ← NestJS API
│   ├── /src
│   │   ├── /modules
│   │   │   ├── /auth           ← Login, JWT, guards
│   │   │   ├── /usuarios
│   │   │   ├── /clientes
│   │   │   ├── /veiculos
│   │   │   ├── /fabricantes
│   │   │   ├── /servicos
│   │   │   ├── /ordens
│   │   │   └── /upload
│   │   ├── /prisma
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── main.ts
│   └── package.json
│
├── /frontend                   ← Angular SPA
│   ├── /src
│   │   ├── /app
│   │   │   ├── /core           ← Guards, interceptors, auth
│   │   │   ├── /shared         ← Componentes reutilizáveis
│   │   │   └── /features       ← Módulos por funcionalidade
│   │   │       ├── /auth
│   │   │       ├── /ordens
│   │   │       ├── /clientes
│   │   │       ├── /veiculos
│   │   │       ├── /servicos
│   │   │       ├── /fabricantes
│   │   │       ├── /usuarios
│   │   │       └── /portal     ← Portal do cliente
│   │   └── /environments
│   └── package.json
│
└── /docs
    ├── DESIGN.md
    └── DEPLOY.md
```

### Convenções de Código Angular

**Separação de Responsabilidades:**

Componentes Angular devem usar arquivos separados para template e lógica:

```
/feature-name/
├── component-name.component.ts      ← Lógica (TypeScript)
└── component-name.component.html    ← Template (HTML)
```

**Estrutura do Componente:**

```typescript
@Component({
  selector: 'app-component-name',
  standalone: true,
  imports: [...],
  templateUrl: './component-name.component.html',
})
export class ComponentNameComponent {
  // Lógica do componente
}
```

**Regras:**
- **Nunca** usar `template` inline - sempre usar `templateUrl`
- **Nunca** usar estilos por componente - usar estilos globais
- Exceção: componentes muito simples (ex: AppComponent com apenas `<router-outlet />`)
- Nomes de arquivos em kebab-case
- Componentes standalone por padrão (Angular 17+)

### Estilos CSS Globais

**Filosofia:** Estilos unificados e reutilizáveis em toda a aplicação.

**Estrutura de Arquivos:**

```
/frontend/src/
├── styles.scss                    ← Ponto de entrada (imports)
└── styles/
    ├── _variables.scss            ← Variáveis (cores, espaçamentos, breakpoints)
    ├── _mixins.scss               ← Mixins reutilizáveis
    ├── _base.scss                 ← Reset, tipografia, elementos base
    ├── _layout.scss               ← Grid, containers, flexbox utilities
    ├── _components.scss           ← Estilos de componentes UI (cards, forms, tables)
    └── _utilities.scss            ← Classes utilitárias (spacing, colors, display)
```

**Classes Utilitárias Padrão:**

| Classe | Descrição |
|--------|-----------|
| `.page-header` | Cabeçalho de página com título e ações |
| `.page-content` | Conteúdo principal da página |
| `.form-container` | Container para formulários |
| `.form-grid` | Grid para campos de formulário |
| `.full-width` | Largura 100% |
| `.loading` | Container centralizado para spinner |
| `.empty` | Mensagem de lista vazia |
| `.clickable-row` | Linha clicável em tabelas |
| `.info-grid` | Grid para exibição de informações |
| `.info-item` | Item de informação (label + valor) |
| `.text-right` | Alinhamento à direita |
| `.text-center` | Alinhamento centralizado |
| `.mt-*`, `.mb-*`, `.p-*` | Margins e paddings |

**Regras de Estilos:**
- **Componentes NÃO devem ter** `styleUrl` ou `styles`
- Usar classes CSS globais definidas em `styles/`
- Seguir convenção BEM para novos seletores quando necessário
- Variáveis SCSS para cores, tamanhos e breakpoints
- Mobile-first para responsividade

---

## Modelo de Dados

### Diagrama de Entidades

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Cliente   │────<│   Veículo   │────<│  OrdemServico   │
└─────────────┘     └─────────────┘     └─────────────────┘
                          │                    │
                    ┌─────┴─────┐    ┌─────────┼─────────┐
                    ▼           │    ▼         ▼         ▼
              ┌──────────┐      │  ┌─────┐  ┌─────┐  ┌─────────┐
              │  Modelo  │      │  │Item │  │Foto │  │Checklist│
              └──────────┘      │  └─────┘  └─────┘  └─────────┘
                    │           │      │
                    ▼           │      ▼
              ┌────────────┐    │  ┌─────────┐
              │ Fabricante │    │  │ Serviço │
              └────────────┘    │  └─────────┘
                                │
                          ┌─────┴─────┐
                          ▼           ▼
                    ┌──────────┐ ┌────────────┐
                    │  Modelo  │ │ItemChecklist│
                    └──────────┘ └────────────┘
```

### Schema Prisma

```prisma
// prisma/schema.prisma

model Usuario {
  id        String   @id @default(cuid())
  nome      String
  email     String   @unique
  senha     String
  papel     Papel    @default(ATENDENTE)
  ativo     Boolean  @default(true)
  criadoEm  DateTime @default(now())

  ordens     OrdemServico[]
  checklists ChecklistPreenchido[]
  historicos HistoricoStatus[]
}

enum Papel {
  ADMIN
  ATENDENTE
}

model Cliente {
  id        String   @id @default(cuid())
  nome      String
  telefone  String
  email     String?
  documento String?
  criadoEm  DateTime @default(now())

  veiculos  Veiculo[]
}

model Fabricante {
  id        String   @id @default(cuid())
  nome      String   @unique
  ativo     Boolean  @default(true)
  criadoEm  DateTime @default(now())

  modelos   Modelo[]
}

model Modelo {
  id           String   @id @default(cuid())
  nome         String
  ativo        Boolean  @default(true)
  criadoEm     DateTime @default(now())

  fabricanteId String
  fabricante   Fabricante @relation(fields: [fabricanteId], references: [id])

  veiculos     Veiculo[]

  @@unique([fabricanteId, nome])
}

model Veiculo {
  id        String   @id @default(cuid())
  placa     String
  cor       String
  ano       Int?
  criadoEm  DateTime @default(now())

  modeloId  String
  modelo    Modelo   @relation(fields: [modeloId], references: [id])

  clienteId String
  cliente   Cliente  @relation(fields: [clienteId], references: [id])

  ordens    OrdemServico[]
}

model Servico {
  id        String      @id @default(cuid())
  nome      String
  tipo      TipoServico
  valor     Decimal     @db.Decimal(10, 2)
  ativo     Boolean     @default(true)
  criadoEm  DateTime    @default(now())

  itens     ItemOrcamento[]
}

enum TipoServico {
  SERVICO
  ADICIONAL
}

model OrdemServico {
  id           String    @id @default(cuid())
  token        String    @unique @default(cuid())
  status       StatusOS  @default(AGUARDANDO)
  valorTotal   Decimal   @db.Decimal(10, 2)
  dataAgendada DateTime?
  aprovadoEm   DateTime?
  criadoEm     DateTime  @default(now())
  atualizadoEm DateTime  @updatedAt

  veiculoId    String
  veiculo      Veiculo   @relation(fields: [veiculoId], references: [id])

  usuarioId    String
  usuario      Usuario   @relation(fields: [usuarioId], references: [id])

  itens        ItemOrcamento[]
  fotos        Foto[]
  checklist    ChecklistPreenchido[]
  historico    HistoricoStatus[]
}

enum StatusOS {
  AGUARDANDO
  APROVADO
  AGENDADO
  EM_ANDAMENTO
  FINALIZADO
}

model HistoricoStatus {
  id         String    @id @default(cuid())
  statusDe   StatusOS?
  statusPara StatusOS
  criadoEm   DateTime  @default(now())

  ordemId    String
  ordem      OrdemServico @relation(fields: [ordemId], references: [id], onDelete: Cascade)

  usuarioId  String?
  usuario    Usuario? @relation(fields: [usuarioId], references: [id])
}

model ItemOrcamento {
  id        String       @id @default(cuid())
  valor     Decimal      @db.Decimal(10, 2)

  ordemId   String
  ordem     OrdemServico @relation(fields: [ordemId], references: [id], onDelete: Cascade)

  servicoId String
  servico   Servico      @relation(fields: [servicoId], references: [id])
}

model Foto {
  id        String       @id @default(cuid())
  url       String
  tipo      TipoFoto
  criadoEm  DateTime     @default(now())

  ordemId   String
  ordem     OrdemServico @relation(fields: [ordemId], references: [id], onDelete: Cascade)
}

enum TipoFoto {
  ENTRADA
  PROGRESSO
  FINAL
}

model ItemChecklist {
  id        String   @id @default(cuid())
  nome      String
  categoria String
  ordem     Int
  ativo     Boolean  @default(true)
  criadoEm  DateTime @default(now())

  preenchidos ChecklistPreenchido[]
}

model ChecklistPreenchido {
  id         String          @id @default(cuid())
  status     StatusChecklist
  observacao String?
  criadoEm   DateTime        @default(now())

  ordemId    String
  ordem      OrdemServico    @relation(fields: [ordemId], references: [id], onDelete: Cascade)

  itemId     String
  item       ItemChecklist   @relation(fields: [itemId], references: [id])

  usuarioId  String
  usuario    Usuario         @relation(fields: [usuarioId], references: [id])

  @@unique([ordemId, itemId])
}

enum StatusChecklist {
  OK
  DEFEITO
  NAO_APLICA
}
```

---

## Fluxo Principal

```
Cliente chega
     │
     ▼
┌─────────────────────────────────────────────┐
│ 1. NOVO ORÇAMENTO                           │
│    - Busca/cadastra cliente                 │
│    - Busca/cadastra veículo                 │
│    - Tira fotos do veículo (entrada)        │
│    - Seleciona serviços + adicionais        │
│    - Gera orçamento com valor total         │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ 2. ENVIO AO CLIENTE                         │
│    - Sistema gera link único do portal      │
│    - Atendente envia link (WhatsApp manual) │
│    - Cliente visualiza e aprova no portal   │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ 3. AGENDAMENTO                              │
│    - Após aprovação, agenda data de entrada │
│    - Aparece na agenda da oficina           │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ 4. INÍCIO DO SERVIÇO                        │
│    - Preenche checklist de funcionalidades  │
│    - Status muda para "Em andamento"        │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ 5. EXECUÇÃO                                 │
│    - Fotos de progresso (aparecem no portal)│
│    - Cliente acompanha pelo link            │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ 6. FINALIZAÇÃO                              │
│    - Fotos finais                           │
│    - Status "Finalizado"                    │
│    - Cliente notificado para retirada       │
└─────────────────────────────────────────────┘
```

---

## Telas do App Interno

### Menu Principal

```
┌─────────────────────────────────┐
│  Auto OS            │
├─────────────────────────────────┤
│  Ordens de Serviço              │  ← Tela inicial
│  Agenda                         │
│  Clientes                       │
│  Veículos                       │
│  Serviços                       │  ← Com filtro por tipo
│  Checklist (config)             │
│  Fabricantes e Modelos          │  ← Admin
│  Usuários                       │  ← Admin
└─────────────────────────────────┘
```

### Telas

| Tela | Funcionalidade |
|------|----------------|
| **Ordens de Serviço** | Lista com filtros (status, data). Acesso rápido a cada OS |
| **Nova OS / Editar OS** | Formulário: cliente, veículo, fotos, serviços, adicionais |
| **Detalhe da OS** | Resumo, fotos, checklist, histórico, link do portal |
| **Agenda** | Calendário com OS agendadas, visualização dia/semana |
| **Clientes** | CRUD, busca por nome/telefone |
| **Veículos** | CRUD, busca por placa, vinculado a cliente e modelo |
| **Serviços** | CRUD com tipo (serviço/adicional), valores |
| **Fabricantes e Modelos** | CRUD com seed inicial |
| **Config Checklist** | Define itens padrão do checklist |
| **Usuários** | Admin gerencia funcionários |

### Responsividade

- **Desktop:** Menu lateral fixo, tabelas completas
- **Mobile:** Menu hamburguer, cards em vez de tabelas, câmera nativa para fotos

---

## Portal do Cliente

### Acesso

- URL: `seudominio.com.br/cliente/[token-unico]`
- Sem login - token identifica a OS
- Token gerado automaticamente ao criar OS

### Layout

```
┌─────────────────────────────────────────────┐
│  Auto OS                        │
│  Acompanhamento do Serviço                  │
├─────────────────────────────────────────────┤
│  Cliente: João da Silva                     │
│  Veículo: Honda Civic Preto - ABC-1234      │
│  Status: Em andamento                       │
├─────────────────────────────────────────────┤
│  ORÇAMENTO                        R$ 1.250  │
├─────────────────────────────────────────────┤
│  • Pintura porta dianteira          R$ 400  │
│  • Pintura paralama                 R$ 350  │
│  • Cor perolizada                   R$ 150  │
│  • Funilaria porta                  R$ 350  │
├─────────────────────────────────────────────┤
│  [ APROVAR ORÇAMENTO ]  ← só se aguardando  │
├─────────────────────────────────────────────┤
│  FOTOS DO VEÍCULO                           │
│  Entrada (12/01): [img] [img] [img]         │
│  Progresso (15/01): [img] [img]             │
├─────────────────────────────────────────────┤
│  CHECKLIST DE ENTRADA                       │
│  ✓ Faróis funcionando                       │
│  ✓ Vidros elétricos                         │
│  ⚠ Ar condicionado - "Já não gelava"        │
│  ✓ Travas elétricas                         │
└─────────────────────────────────────────────┘
```

### Funcionalidades

| Ação | Descrição |
|------|-----------|
| **Visualizar orçamento** | Sempre disponível |
| **Aprovar orçamento** | Botão aparece só quando status é "Aguardando" |
| **Ver fotos** | Organizadas por data e tipo |
| **Ver checklist** | Estado do veículo na entrada |

---

## Checklist de Funcionalidades

### Itens Padrão

```
ELÉTRICA
- Faróis dianteiros
- Lanternas traseiras
- Setas
- Luz de freio
- Vidros elétricos
- Travas elétricas
- Retrovisores elétricos

CLIMATIZAÇÃO
- Ar condicionado
- Ventilação

GERAL
- Buzina
- Limpador de para-brisa
- Painel sem alertas
- Freio de mão

APARÊNCIA (pré-existentes)
- Riscos na pintura
- Amassados não relacionados ao serviço
- Para-choques
```

### Preenchimento

Para cada item:
- **OK** - Funcionando normalmente
- **Defeito** - Com problema (observação obrigatória)
- **N/A** - Não se aplica

### Proteção Legal

- Registrado com data/hora e usuário
- Visível no portal do cliente
- Exportável em PDF

---

## Permissões

### Papéis

| Papel | Descrição |
|-------|-----------|
| **ADMIN** | Acesso total, gerencia usuários e configurações |
| **ATENDENTE** | Operação do dia-a-dia |

### Matriz

| Funcionalidade | ADMIN | ATENDENTE |
|----------------|-------|-----------|
| Ordens de Serviço (CRUD) | ✓ | ✓ |
| Clientes (CRUD) | ✓ | ✓ |
| Veículos (CRUD) | ✓ | ✓ |
| Agenda | ✓ | ✓ |
| Fotos | ✓ | ✓ |
| Checklist (preencher) | ✓ | ✓ |
| Serviços (CRUD) | ✓ | Só visualiza |
| Fabricantes/Modelos (CRUD) | ✓ | Só visualiza |
| Itens do Checklist (config) | ✓ | - |
| Usuários (CRUD) | ✓ | - |

### Regras

- Primeiro usuário é automaticamente ADMIN
- ADMIN não pode remover a si mesmo
- ATENDENTE vê todas as OS

---

## Preparação para Multi-tenant

### Estratégia Futura: Banco por Tenant

```
┌─────────────────────────────────────────────┐
│            App Principal                     │
│       (código único, compartilhado)          │
└─────────────────────────────────────────────┘
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
  ┌─────────┐   ┌─────────┐   ┌─────────┐
  │ DB Ofi1 │   │ DB Ofi2 │   │ DB Ofi3 │
  └─────────┘   └─────────┘   └─────────┘
```

### Fazer Agora

- IDs não sequenciais (CUID)
- Nome da oficina em variável de ambiente
- Portal funciona com qualquer domínio
- Fotos em cloud (Cloudinary)

### NÃO Fazer Agora

- Tabela de Oficina/Tenant
- `oficinaId` em todas as tabelas
- Sistema de assinaturas/pagamentos
- Painel administrativo multi-tenant

---

## Dados Iniciais (Seed)

### Fabricantes e Modelos

```
Chevrolet: Onix, Onix Plus, Tracker, S10, Spin, Cruze
Fiat: Argo, Cronos, Mobi, Strada, Toro, Pulse
Ford: Ka, EcoSport, Ranger, Territory
Honda: Civic, City, HR-V, CR-V, Fit, WR-V
Hyundai: HB20, HB20S, Creta, Tucson, Santa Fe
Jeep: Renegade, Compass, Commander
Nissan: Kicks, Versa, Frontier, Sentra
Peugeot: 208, 2008, 3008, Partner
Renault: Kwid, Sandero, Logan, Duster, Oroch
Toyota: Corolla, Corolla Cross, Hilux, Yaris, SW4
Volkswagen: Gol, Polo, Virtus, T-Cross, Nivus, Amarok
```

### Itens do Checklist

Conforme listado na seção "Checklist de Funcionalidades".
