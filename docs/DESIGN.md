# Auto OS - Design do Sistema

**Objetivo:** Sistema SaaS multi-tenant de gestao para oficinas de funilaria com orcamentos, agenda e acompanhamento de servicos

---

## Visao Geral

Sistema web responsivo (PC e celular) para gestao de oficinas de funilaria. Permite cadastro de clientes, veiculos, servicos, emissao de orcamentos, agendamento e acompanhamento do servico pelo cliente atraves de um portal publico.

Opera no modelo **SaaS multi-tenant**: um SUPERADMIN gerencia empresas (oficinas) que contratam o sistema, cada uma com seus dados isolados.

### Arquitetura Geral

```
                       ┌──────────────────────────────────────────────────┐
                       │             Angular SPA (Frontend)              │
                       │  ┌───────────┐ ┌──────────────┐ ┌───────────┐  │
                       │  │  /:slug/* │ │ /admin/*     │ │ /portal/* │  │
                       │  │  App      │ │ SuperAdmin   │ │ Publico   │  │
                       │  │  Tenant   │ │ Panel        │ │ Cliente   │  │
                       │  └───────────┘ └──────────────┘ └───────────┘  │
                       └───────────────────────┬────────────────────────┘
                                               │
                       ┌───────────────────────┼────────────────────────┐
                       │              NestJS API (Backend)              │
                       │  ┌──────────┐ ┌────────────┐ ┌────────────┐   │
                       │  │ Tenant   │ │ Auth/JWT   │ │ Empresas   │   │
                       │  │ Guard    │ │ Guard      │ │ CRUD       │   │
                       │  └──────────┘ └────────────┘ └────────────┘   │
                       └───────────────────────┬────────────────────────┘
                                               │
                       ┌───────────┬───────────┼───────────┐
                       ▼           ▼           ▼           ▼
                  PostgreSQL   Cloudinary    Email       Upload
                  (dados)      (fotos)     (SMTP)      (local)
```

### Tres Mundos

1. **App Tenant** (`/:slug/*`) - Funcionarios de cada oficina trabalham com login obrigatorio
2. **Painel SuperAdmin** (`/admin/*`) - Gerenciamento de empresas pelo SUPERADMIN
3. **Portal do Cliente** (`/portal/:token`) - Cliente acompanha via link unico (sem login)

---

## Stack Tecnico

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| **Frontend** | Angular 19 (standalone) | Framework robusto, TypeScript nativo, signals |
| **UI** | Angular Material | Componentes oficiais, Material Design, responsivo |
| **Backend** | NestJS | Arquitetura modular, similar ao Angular, TypeScript |
| **Banco** | PostgreSQL | Robusto, relacional, bom para dados estruturados |
| **ORM** | Prisma | Type-safe, migrations faceis, boa DX |
| **Autenticacao** | JWT + Passport | Padrao de mercado, stateless, escalavel |
| **Upload de Fotos** | Upload local + Cloudinary | Upload local dev, Cloudinary producao |
| **Validacao** | class-validator (NestJS) + Angular Forms | Validacao em ambas as pontas |
| **PDF** | pdfmake | Geracao de PDF de orcamentos |
| **Deploy** | VPS/Docker ou Vercel+Render | Flexivel, controle total |

### Estrutura de Pastas

```
/auto-os
├── /backend                    ← NestJS API
│   ├── /src
│   │   ├── /modules
│   │   │   ├── /auth           ← Login, JWT, guards
│   │   │   ├── /tenant         ← TenantService, TenantGuard (multi-tenant)
│   │   │   ├── /empresas       ← CRUD empresas (SUPERADMIN)
│   │   │   ├── /usuarios
│   │   │   ├── /clientes
│   │   │   ├── /veiculos
│   │   │   ├── /fabricantes
│   │   │   ├── /servicos
│   │   │   ├── /ordens
│   │   │   ├── /checklist
│   │   │   ├── /dashboard
│   │   │   ├── /relatorios
│   │   │   ├── /email
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
│   │   │   ├── /core           ← Guards, interceptors, auth, tenant
│   │   │   ├── /shared         ← Componentes reutilizaveis
│   │   │   ├── /layout         ← Sidenav, header
│   │   │   └── /features       ← Modulos por funcionalidade
│   │   │       ├── /login
│   │   │       ├── /landing
│   │   │       ├── /admin      ← Painel SUPERADMIN
│   │   │       ├── /dashboard
│   │   │       ├── /ordens
│   │   │       ├── /clientes
│   │   │       ├── /veiculos
│   │   │       ├── /servicos
│   │   │       ├── /fabricantes
│   │   │       ├── /usuarios
│   │   │       ├── /checklist
│   │   │       ├── /agenda
│   │   │       └── /portal     ← Portal do cliente
│   │   └── /environments
│   └── package.json
│
└── /docs
    ├── DESIGN.md
    └── DEPLOY.md
```

### Convencoes de Codigo Angular

**Separacao de Responsabilidades:**

Componentes Angular devem usar arquivos separados para template e logica:

```
/feature-name/
├── component-name.component.ts      ← Logica (TypeScript)
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
  // Logica do componente
}
```

**Regras:**
- **Nunca** usar `template` inline - sempre usar `templateUrl`
- **Nunca** usar estilos por componente - usar estilos globais
- Excecao: componentes muito simples (ex: AppComponent com apenas `<router-outlet />`)
- Nomes de arquivos em kebab-case
- Componentes standalone por padrao (Angular 19)

### Estilos CSS Globais

**Filosofia:** Estilos unificados e reutilizaveis em toda a aplicacao.

**Estrutura de Arquivos:**

```
/frontend/src/
├── styles.scss                    ← Ponto de entrada (imports)
└── styles/
    ├── _variables.scss            ← Variaveis (cores, espacamentos, breakpoints)
    ├── _mixins.scss               ← Mixins reutilizaveis
    ├── _base.scss                 ← Reset, tipografia, elementos base
    ├── _layout.scss               ← Grid, containers, flexbox utilities
    ├── _components.scss           ← Estilos de componentes UI (cards, forms, tables)
    └── _utilities.scss            ← Classes utilitarias (spacing, colors, display)
```

**Regras de Estilos:**
- Componentes NAO devem ter `styleUrl` ou `styles`
- Usar classes CSS globais definidas em `styles/`
- Seguir convencao BEM para novos seletores quando necessario
- Variaveis SCSS para cores, tamanhos e breakpoints
- Mobile-first para responsividade

---

## Arquitetura Multi-Tenant

### Estrategia

**Schema unico com coluna `empresaId`** em todas as tabelas tenant-scoped. Cada empresa (oficina) tem seus dados isolados no mesmo banco de dados.

```
┌────────────────────────────────────────────────────────────────┐
│                     PostgreSQL (Schema Unico)                  │
│                                                                │
│  ┌──────────┐                                                  │
│  │ Empresa  │──┬─────────────────────────────────────────┐     │
│  │(tenant)  │  │ empresaId FK em todas tabelas scoped    │     │
│  └──────────┘  │                                         │     │
│                ▼                                         ▼     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐        │
│  │ Usuario  │ │ Cliente  │ │ Veiculo  │ │OrdemServico│ ...    │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘        │
│                                                                │
│  Dados compartilhados (SEM empresaId):                         │
│  ┌────────────┐ ┌──────────┐ ┌──────────────┐ ┌────────────┐  │
│  │ Fabricante │ │  Modelo  │ │ItemChecklist │ │ItemOrcamento│ │
│  └────────────┘ └──────────┘ └──────────────┘ └────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Identificacao do Tenant

- **URL com slug**: `/:slug/dashboard`, `/:slug/ordens`, etc.
- **JWT**: Contem `empresaId` no payload, extraido no login
- **Backend**: `TenantService` (request-scoped) extrai `empresaId` do request.user
- **Frontend**: `TenantService` armazena empresa no localStorage, expoe `slug()` signal

### Tabelas Tenant-Scoped (com `empresaId`)

| Tabela | Descricao |
|--------|-----------|
| `Usuario` | Usuarios do sistema (unique composto: `[email, empresaId]`) |
| `Cliente` | Clientes da oficina |
| `Veiculo` | Veiculos dos clientes |
| `OrdemServico` | Ordens de servico |
| `Servico` | Catalogo de servicos da oficina |
| `Foto` | Fotos de veiculos |
| `ChecklistPreenchido` | Checklist preenchido por ordem |
| `HistoricoStatus` | Historico de mudancas de status |

### Tabelas Compartilhadas (sem `empresaId`)

| Tabela | Descricao |
|--------|-----------|
| `Fabricante` | Fabricantes de veiculos (compartilhado) |
| `Modelo` | Modelos de veiculos (compartilhado) |
| `ItemChecklist` | Itens de configuracao do checklist (compartilhado) |
| `ItemOrcamento` | Itens do orcamento (vinculado a OrdemServico que ja tem empresaId) |

### Fluxo de Autenticacao Multi-Tenant

```
Login (email + senha)
     │
     ▼
┌─────────────────────────────────┐
│ AuthService.login()             │
│ - findFirst({ email })          │
│ - Valida senha                  │
│ - Valida empresa.status         │
│ - Retorna JWT com empresaId     │
│ - Retorna empresa { slug, nome }│
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Frontend: AuthService           │
│ - Armazena token                │
│ - TenantService.setEmpresa()   │
│ - Redireciona:                  │
│   SUPERADMIN → /admin           │
│   Outros → /:slug/dashboard     │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Cada request API:               │
│ JwtAuthGuard → extrai user      │
│ TenantGuard → valida empresa    │
│   - Status ATIVA?               │
│   - Plano vencido?              │
│   - SUPERADMIN bypass?          │
│ TenantService → empresaId       │
│ Service → where: { empresaId }  │
└─────────────────────────────────┘
```

### Caso Especial: Portal Publico

O portal do cliente (`/portal/:token`) **nao tem autenticacao**. Para queries scoped:
- O `empresaId` e extraido diretamente do registro da `OrdemServico` associada ao token
- **Nao usa** `TenantService` (que requer JWT)

---

## Modelo de Dados

### Diagrama de Entidades

```
┌──────────┐
│ Empresa  │ (tenant root)
└────┬─────┘
     │ empresaId
     ├───────────────┬───────────────┬───────────────┬──────────────┐
     ▼               ▼               ▼               ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐
│ Usuario  │  │ Cliente  │  │ OrdemServico │  │ Servico  │  │  Foto    │
└──────────┘  └────┬─────┘  └──────┬───────┘  └──────────┘  └──────────┘
                   │               │
                   ▼               ├───────────┬──────────┐
             ┌──────────┐         ▼           ▼          ▼
             │ Veiculo  │   ┌──────────┐ ┌────────┐ ┌──────────────────┐
             └──────────┘   │  Item    │ │Historico│ │Checklist         │
                   │        │Orcamento │ │ Status │ │ Preenchido       │
                   ▼        └──────────┘ └────────┘ └──────────────────┘
             ┌──────────┐         │                        │
             │  Modelo  │         ▼                        ▼
             └──────────┘   ┌──────────┐            ┌──────────────┐
                   │        │ Servico  │            │ ItemChecklist│
                   ▼        └──────────┘            └──────────────┘
             ┌────────────┐
             │ Fabricante │
             └────────────┘

  (Fabricante, Modelo, ItemChecklist = compartilhados, sem empresaId)
```

### Schema Prisma

```prisma
// === EMPRESA (MULTI-TENANT) ===

enum StatusEmpresa {
  ATIVA
  SUSPENSA
  CANCELADA
}

model Empresa {
  id              String         @id @default(cuid())
  nome            String
  slug            String         @unique
  logoUrl         String?
  telefone        String?
  email           String?
  endereco        String?
  status          StatusEmpresa  @default(ATIVA)
  dataVencimento  DateTime?
  plano           String?
  criadoEm        DateTime       @default(now())
  atualizadoEm    DateTime       @updatedAt

  usuarios              Usuario[]
  clientes              Cliente[]
  veiculos              Veiculo[]
  ordens                OrdemServico[]
  servicos              Servico[]
  fotos                 Foto[]
  checklistsPreenchidos ChecklistPreenchido[]
  historicos            HistoricoStatus[]
}

// === AUTENTICACAO ===

model Usuario {
  id        String   @id @default(cuid())
  nome      String
  email     String
  senha     String
  papel     Papel    @default(ATENDENTE)
  ativo     Boolean  @default(true)
  criadoEm  DateTime @default(now())

  empresaId String
  empresa   Empresa  @relation(fields: [empresaId], references: [id])

  @@unique([email, empresaId])
}

enum Papel {
  SUPERADMIN
  ADMIN
  ATENDENTE
}

// === CLIENTES E VEICULOS ===

model Cliente {
  id        String   @id @default(cuid())
  nome      String
  telefone  String
  email     String?
  documento String?
  criadoEm  DateTime @default(now())

  empresaId String
  empresa   Empresa  @relation(fields: [empresaId], references: [id])

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
  id           String     @id @default(cuid())
  nome         String
  ativo        Boolean    @default(true)
  criadoEm     DateTime   @default(now())

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
  clienteId String
  empresaId String

  ordens    OrdemServico[]
}

// === SERVICOS ===

model Servico {
  id        String      @id @default(cuid())
  nome      String
  tipo      TipoServico
  valor     Decimal     @db.Decimal(10, 2)
  ativo     Boolean     @default(true)
  criadoEm  DateTime    @default(now())

  empresaId String

  itens     ItemOrcamento[]
}

enum TipoServico {
  SERVICO
  ADICIONAL
}

// === ORDENS DE SERVICO ===

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
  usuarioId    String
  empresaId    String

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
  usuarioId  String?
  empresaId  String
}

model ItemOrcamento {
  id        String       @id @default(cuid())
  valor     Decimal      @db.Decimal(10, 2)

  ordemId   String
  servicoId String
}

model Foto {
  id        String       @id @default(cuid())
  url       String
  tipo      TipoFoto
  criadoEm  DateTime     @default(now())

  ordemId   String
  empresaId String
}

enum TipoFoto {
  ENTRADA
  PROGRESSO
  FINAL
}

// === CHECKLIST ===

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
  itemId     String
  usuarioId  String
  empresaId  String

  @@unique([ordemId, itemId])
}

enum StatusChecklist {
  OK
  DEFEITO
  NAO_APLICA
}
```

---

## Permissoes

### Papeis

| Papel | Descricao |
|-------|-----------|
| **SUPERADMIN** | Gerencia empresas, acesso total ao sistema, bypassa guards |
| **ADMIN** | Acesso total dentro da sua empresa, gerencia usuarios e configuracoes |
| **ATENDENTE** | Operacao do dia-a-dia dentro da sua empresa |

### Matriz

| Funcionalidade | SUPERADMIN | ADMIN | ATENDENTE |
|----------------|------------|-------|-----------|
| Gerenciar empresas | ✓ | - | - |
| Ordens de Servico (CRUD) | ✓ | ✓ | ✓ |
| Clientes (CRUD) | ✓ | ✓ | ✓ |
| Veiculos (CRUD) | ✓ | ✓ | ✓ |
| Agenda | ✓ | ✓ | ✓ |
| Fotos | ✓ | ✓ | ✓ |
| Checklist (preencher) | ✓ | ✓ | ✓ |
| Servicos (CRUD) | ✓ | ✓ | So visualiza |
| Fabricantes/Modelos (CRUD) | ✓ | ✓ | So visualiza |
| Itens do Checklist (config) | ✓ | ✓ | - |
| Usuarios (CRUD) | ✓ | ✓ | - |

### Regras

- SUPERADMIN bypassa qualquer role check e TenantGuard
- ADMIN nao pode remover a si mesmo
- ATENDENTE ve todas as OS da sua empresa
- Email do usuario e unique por empresa (`@@unique([email, empresaId])`)

---

## Infraestrutura Multi-Tenant (Backend)

### TenantModule (Global)

```
backend/src/modules/tenant/
├── tenant.module.ts      ← Global module
├── tenant.service.ts     ← Request-scoped, expoe empresaId
└── tenant.guard.ts       ← Valida empresa ativa e plano
```

**TenantService** (request-scoped):
- Extrai `empresaId` do `request.user` (populado pelo JwtAuthGuard)
- Lanca `ForbiddenException` se usuario nao vinculado a empresa
- Expoe `isSuperAdmin` getter

**TenantGuard**:
1. SUPERADMIN → bypass (return true)
2. Verifica se usuario tem `empresaId`
3. Busca empresa no banco
4. Valida `status === 'ATIVA'`
5. Valida `dataVencimento` (se definida, nao pode estar vencida)

### Padrao de Scoping nos Services

Todos os services tenant-scoped injetam `TenantService` e:

```typescript
// findMany: filtra por empresaId
findAll() {
  return this.prisma.model.findMany({
    where: { empresaId: this.tenant.empresaId },
  });
}

// findOne: usa findFirst com empresaId (nao findUnique por id)
findOne(id: string) {
  return this.prisma.model.findFirst({
    where: { id, empresaId: this.tenant.empresaId },
  });
}

// create: inclui empresaId
create(dto) {
  return this.prisma.model.create({
    data: { ...dto, empresaId: this.tenant.empresaId },
  });
}
```

### EmpresasModule (SUPERADMIN)

```
backend/src/modules/empresas/
├── empresas.module.ts
├── empresas.service.ts
├── empresas.controller.ts
└── dto/
    ├── create-empresa.dto.ts
    └── update-empresa.dto.ts
```

**Endpoints** (todos `@Roles('SUPERADMIN')`):

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/empresas` | Lista empresas (com busca) |
| GET | `/api/empresas/:id` | Detalhe da empresa |
| GET | `/api/empresas/:id/stats` | Estatisticas (usuarios, ordens, faturamento) |
| POST | `/api/empresas` | Criar empresa (slug auto-gerado) |
| PUT | `/api/empresas/:id` | Atualizar empresa |
| PATCH | `/api/empresas/:id/status` | Alterar status (ATIVA/SUSPENSA/CANCELADA) |
| DELETE | `/api/empresas/:id` | Remover empresa (se sem dados) |

### Guards Aplicados

| Controller | Guards |
|------------|--------|
| AuthController | Nenhum (publico) |
| PortalController | Nenhum (publico, acesso por token) |
| FabricantesController | JwtAuthGuard, RolesGuard |
| ModelosController | JwtAuthGuard, RolesGuard |
| EmpresasController | JwtAuthGuard, RolesGuard (`SUPERADMIN`) |
| ClientesController | JwtAuthGuard, RolesGuard, **TenantGuard** |
| VeiculosController | JwtAuthGuard, RolesGuard, **TenantGuard** |
| ServicosController | JwtAuthGuard, RolesGuard, **TenantGuard** |
| OrdensController | JwtAuthGuard, RolesGuard, **TenantGuard** |
| ChecklistController | JwtAuthGuard, RolesGuard, **TenantGuard** |
| DashboardController | JwtAuthGuard, RolesGuard, **TenantGuard** |
| UsuariosController | JwtAuthGuard, RolesGuard, **TenantGuard** |

---

## Rotas do Frontend

### Estrutura de Rotas

```
/                          → Landing page (publico)
/login                     → Login (publico)
/portal/:token             → Portal do cliente (publico)
/admin                     → Painel SUPERADMIN (authGuard + superAdminGuard)
  /admin/empresas          → Lista empresas
  /admin/empresas/nova     → Criar empresa
  /admin/empresas/:id      → Detalhe empresa
  /admin/empresas/:id/editar → Editar empresa
/:slug                     → App tenant (tenantGuard)
  /:slug/dashboard         → Dashboard
  /:slug/ordens            → Ordens de servico
  /:slug/clientes          → Clientes
  /:slug/veiculos          → Veiculos
  /:slug/servicos          → Servicos
  /:slug/fabricantes       → Fabricantes e modelos
  /:slug/agenda            → Agenda
  /:slug/checklist         → Config checklist (adminGuard)
  /:slug/usuarios          → Usuarios (adminGuard)
```

### Guards do Frontend

| Guard | Funcao |
|-------|--------|
| `authGuard` | Verifica token JWT valido |
| `adminGuard` | Verifica papel ADMIN ou SUPERADMIN |
| `superAdminGuard` | Verifica papel SUPERADMIN |
| `tenantGuard` | Valida slug da URL vs empresa armazenada |

### TenantService (Frontend)

- Armazena empresa (`id`, `slug`, `nome`, `logoUrl`) no localStorage
- Expoe `slug()` como computed signal
- Expoe `empresa()` como readonly signal
- Helper `route(path)` que prefixa com `/${slug}/`
- Populado no login, limpo no logout

### Navegacao

Todos os componentes usam `TenantService.route()` ou interpolacao com slug para navegacao:
```typescript
this.router.navigate([this.tenantService.route('/ordens')]);
// ou
routerLink="/{{ tenantService.slug() }}/ordens"
```

---

## Fluxo Principal

```
Cliente chega
     │
     ▼
┌─────────────────────────────────────────────┐
│ 1. NOVO ORCAMENTO                           │
│    - Busca/cadastra cliente                 │
│    - Busca/cadastra veiculo                 │
│    - Tira fotos do veiculo (entrada)        │
│    - Seleciona servicos + adicionais        │
│    - Gera orcamento com valor total         │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ 2. ENVIO AO CLIENTE                         │
│    - Sistema gera link unico do portal      │
│    - Atendente envia link (WhatsApp manual) │
│    - Cliente visualiza e aprova no portal   │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ 3. AGENDAMENTO                              │
│    - Apos aprovacao, agenda data de entrada │
│    - Aparece na agenda da oficina           │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ 4. INICIO DO SERVICO                        │
│    - Preenche checklist de funcionalidades  │
│    - Status muda para "Em andamento"        │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ 5. EXECUCAO                                 │
│    - Fotos de progresso (aparecem no portal)│
│    - Cliente acompanha pelo link            │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ 6. FINALIZACAO                              │
│    - Fotos finais                           │
│    - Status "Finalizado"                    │
│    - Cliente notificado para retirada       │
└─────────────────────────────────────────────┘
```

---

## Telas do App

### Menu Principal (Tenant)

```
┌─────────────────────────────────┐
│  [Nome da Empresa]              │
├─────────────────────────────────┤
│  Dashboard                      │
│  Ordens de Servico              │
│  Agenda                         │
│  Clientes                       │
│  Veiculos                       │
│  Servicos                       │
│  Fabricantes e Modelos          │
│  Checklist (config)             │  ← Admin
│  Usuarios                       │  ← Admin
└─────────────────────────────────┘
```

### Menu SuperAdmin

```
┌─────────────────────────────────┐
│  AutoOS - Admin                 │
├─────────────────────────────────┤
│  Empresas                       │
└─────────────────────────────────┘
```

### Telas Tenant

| Tela | Funcionalidade |
|------|----------------|
| **Dashboard** | Contadores, faturamento, ordens recentes |
| **Ordens de Servico** | Lista com filtros (status, data). Acesso rapido a cada OS |
| **Nova OS / Editar OS** | Formulario: cliente, veiculo, fotos, servicos, adicionais |
| **Detalhe da OS** | Resumo, fotos, checklist, historico, link do portal, PDF |
| **Agenda** | Calendario com OS agendadas |
| **Clientes** | CRUD, busca por nome/telefone |
| **Veiculos** | CRUD, busca por placa, vinculado a cliente e modelo |
| **Servicos** | CRUD com tipo (servico/adicional), valores |
| **Fabricantes e Modelos** | CRUD com seed inicial |
| **Config Checklist** | Define itens padrao do checklist |
| **Usuarios** | Admin gerencia funcionarios |

### Telas SuperAdmin

| Tela | Funcionalidade |
|------|----------------|
| **Lista Empresas** | Tabela com nome, slug, status (badge), vencimento, contadores |
| **Criar/Editar Empresa** | Form: nome, slug, telefone, email, endereco, dataVencimento |
| **Detalhe Empresa** | Info + stats + acoes de status + "Acessar como empresa" |

### Responsividade

- **Desktop:** Menu lateral fixo, tabelas completas
- **Mobile:** Menu hamburguer, cards em vez de tabelas, camera nativa para fotos

---

## Portal do Cliente

### Acesso

- URL: `seudominio.com.br/portal/[token-unico]`
- Sem login - token identifica a OS
- Token gerado automaticamente ao criar OS
- Mostra dados da empresa (nome) no cabecalho

### Funcionalidades

| Acao | Descricao |
|------|-----------|
| **Visualizar orcamento** | Sempre disponivel |
| **Aprovar orcamento** | Botao aparece so quando status e "Aguardando" |
| **Ver fotos** | Organizadas por data e tipo |
| **Ver checklist** | Estado do veiculo na entrada |

---

## Checklist de Funcionalidades

### Itens Padrao

```
ELETRICA
- Farois dianteiros
- Lanternas traseiras
- Setas
- Luz de freio
- Vidros eletricos
- Travas eletricas
- Retrovisores eletricos

CLIMATIZACAO
- Ar condicionado
- Ventilacao

GERAL
- Buzina
- Limpador de para-brisa
- Painel sem alertas
- Freio de mao

APARENCIA (pre-existentes)
- Riscos na pintura
- Amassados nao relacionados ao servico
- Para-choques
```

### Preenchimento

Para cada item:
- **OK** - Funcionando normalmente
- **Defeito** - Com problema (observacao obrigatoria)
- **N/A** - Nao se aplica

---

## Dados Iniciais (Seed)

### Empresa Padrao
- ID: `default-empresa`
- Slug: `oficina-padrao`
- Nome: `Oficina Padrao`

### Usuarios Iniciais

| Email | Senha | Papel | Empresa |
|-------|-------|-------|---------|
| `super@autoos.com` | `super123` | SUPERADMIN | oficina-padrao |
| `admin@oficina.com` | `admin123` | ADMIN | oficina-padrao |

### Outros Dados

| Dado | Quantidade |
|------|-----------|
| Fabricantes | 30 |
| Modelos de veiculos | 150+ |
| Servicos | 18 |
| Itens de checklist | 16 |

---

## Email e Relatorios

### Email

Emails sao enviados com o nome da empresa no assunto:
- Orcamento criado: `Orcamento para [PLACA] - [EMPRESA]`
- Orcamento aprovado: `Orcamento Aprovado - [PLACA] - [EMPRESA]`
- Servico finalizado: `Servico Finalizado - [PLACA] - [EMPRESA]`

### PDF de Orcamento

Gerado via `pdfmake` com dados da empresa no cabecalho:
- Nome da empresa
- Endereco
- Telefone
- Link do portal para aprovacao
