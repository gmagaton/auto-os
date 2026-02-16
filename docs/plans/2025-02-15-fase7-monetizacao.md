# Fase 7: Monetizacao

## Contexto

AutoOS e um SaaS multi-tenant para oficinas mecanicas. As fases 1-6 implementaram o core (CRUD, workflow de OS, multi-tenant, painel admin). A fase 7 foca em monetizacao: planos, assinaturas, self-service, reset de senha e dashboard do SUPERADMIN.

## Decisoes

- **Cobranca**: Hibrida — controle manual agora, estrutura pronta para gateway futuro
- **Diferenciacao de planos**: Limite de usuarios (funcionalidades iguais para todos)
- **Trial**: 14 dias, bloqueio apenas na criacao de OS apos vencimento
- **Onboarding**: Self-service automatico (formulario publico, empresa criada em trial)
- **Extras**: Reset de senha + Dashboard SUPERADMIN

---

## 1. Modelo de Planos

### Estrutura de planos

| Plano | Usuarios | Preco sugerido |
|---|---|---|
| Trial | ilimitado (14 dias) | Gratis |
| Basico | 2 | R$ X/mes |
| Profissional | 5 | R$ Y/mes |
| Enterprise | ilimitado | R$ Z/mes |

### Novo model `Plano`

```prisma
model Plano {
  id           String      @id @default(cuid())
  nome         String
  slug         String      @unique
  maxUsuarios  Int?        // null = ilimitado
  preco        Decimal     @db.Decimal(10, 2)
  ativo        Boolean     @default(true)
  criadoEm     DateTime    @default(now())

  assinaturas  Assinatura[]
}
```

### Novo enum e model `Assinatura`

```prisma
enum StatusAssinatura {
  TRIAL
  ATIVA
  VENCIDA
  CANCELADA
}

model Assinatura {
  id         String             @id @default(cuid())
  dataInicio DateTime           @default(now())
  dataFim    DateTime
  status     StatusAssinatura   @default(TRIAL)
  criadoEm   DateTime           @default(now())

  empresaId  String
  empresa    Empresa            @relation(fields: [empresaId], references: [id])

  planoId    String
  plano      Plano              @relation(fields: [planoId], references: [id])
}
```

### Alteracoes na `Empresa`

- Remove campo `plano` (String?) — migra para model Assinatura
- Remove campo `dataVencimento` (DateTime?) — migra para Assinatura.dataFim
- Mantem `status` (ATIVA, SUSPENSA, CANCELADA) para controle manual do SUPERADMIN
- Adiciona relacao `assinaturas Assinatura[]`

### Regras de bloqueio

- Trial vencido ou assinatura vencida: bloqueia apenas **criacao de OS**
- Tudo mais continua funcionando (consulta, edicao, relatorios)
- SUPERADMIN pode estender/renovar manualmente

---

## 2. Self-Service e Onboarding

### Fluxo de cadastro publico (`/cadastro`)

1. Formulario: nome da empresa, slug (auto-gerado, editavel), nome do admin, email, senha
2. Backend cria Empresa (status ATIVA) + Assinatura (TRIAL, dataFim = +14 dias) + Usuario (papel ADMIN)
3. Redireciona para `/:slug/dashboard` ja logado
4. Sem verificacao de email no MVP

### Validacoes

- Slug unico (verificacao em tempo real)
- Email unico por empresa
- Senha minimo 6 caracteres

### Enforcement do limite de usuarios

- `usuarios.service.ts`: antes de criar, conta ativos na empresa
- Compara com `plano.maxUsuarios` da assinatura ativa
- Se excede: erro "Limite de usuarios do plano atingido"

### Enforcement do bloqueio de OS

- `ordens.service.ts`: antes de criar OS, verifica assinatura
- TRIAL com `dataFim < agora`: erro "Periodo de teste expirado"
- VENCIDA: erro "Assinatura vencida"
- Apenas no `create`, nao no `update`

### Cron job diario

- Verifica assinaturas onde `dataFim < hoje` e `status = TRIAL ou ATIVA`
- Atualiza status para VENCIDA
- Nao suspende a empresa, apenas marca a assinatura

---

## 3. Reset de Senha

### Fluxo

1. Tela `/esqueci-senha`: usuario informa email
2. Backend busca usuario(s) pelo email, envia para todos encontrados
3. Gera token CUID com expiracao de 1 hora
4. Email com link `/:slug/redefinir-senha/:token`
5. Tela valida token, permite nova senha
6. Apos redefinir, redireciona para `/:slug/login`

### Novo model `ResetSenha`

```prisma
model ResetSenha {
  id         String    @id @default(cuid())
  token      String    @unique @default(cuid())
  expiradoEm DateTime
  usadoEm    DateTime?
  criadoEm   DateTime  @default(now())

  usuarioId  String
  usuario    Usuario   @relation(fields: [usuarioId], references: [id])
}
```

### Endpoints

- `POST /api/auth/esqueci-senha` — recebe `{ email }`, envia email(s)
- `POST /api/auth/redefinir-senha` — recebe `{ token, novaSenha }`

### Seguranca

- Resposta generica: "Se o email existir, enviaremos instrucoes"
- Token expira em 1 hora, single-use

---

## 4. Dashboard SUPERADMIN

### Metricas (cards)

| Card | Calculo |
|---|---|
| Empresas Ativas | count assinatura ATIVA |
| Em Trial | count assinatura TRIAL nao vencida |
| Vencidas | count assinatura VENCIDA |
| MRR | soma precos planos com assinatura ATIVA |

### Graficos e listas

- Evolucao de empresas (6 meses): barras empilhadas trial/ativas/vencidas
- Vencimentos proximos (7 dias): tabela com acao "Renovar"
- Ultimos cadastros (7 dias): nome, slug, data, status

### Endpoints

- `GET /api/empresas/dashboard` — retorna todos os agregados

### Frontend

- Rota `/admin/dashboard` (tela inicial do admin)
- `/admin` redireciona para `/admin/dashboard`
- Link "Dashboard" no sidenav admin

---

## 5. Arquivos

### Criar (11 arquivos)

| Arquivo | Descricao |
|---|---|
| `backend/prisma/migrations/.../migration.sql` | Plano, Assinatura, ResetSenha |
| `backend/src/modules/planos/planos.module.ts` | Modulo CRUD planos |
| `backend/src/modules/planos/planos.service.ts` | Logica de negocios |
| `backend/src/modules/planos/planos.controller.ts` | Endpoints SUPERADMIN |
| `backend/src/modules/planos/dto/create-plano.dto.ts` | DTO criacao |
| `backend/src/modules/assinaturas/assinaturas.module.ts` | Modulo assinaturas |
| `backend/src/modules/assinaturas/assinaturas.service.ts` | Trial, vencimento, renovacao |
| `backend/src/modules/assinaturas/assinaturas.cron.ts` | Job diario vencimento |
| `frontend/src/app/features/cadastro/cadastro.component.ts` | Tela /cadastro |
| `frontend/src/app/features/auth/esqueci-senha.component.ts` | Tela /esqueci-senha |
| `frontend/src/app/features/auth/redefinir-senha.component.ts` | Tela /:slug/redefinir-senha/:token |

### Modificar (~15 arquivos)

| Arquivo | Mudanca |
|---|---|
| `backend/prisma/schema.prisma` | Models: Plano, Assinatura, ResetSenha |
| `backend/prisma/seed.ts` | Seed planos + assinatura default |
| `backend/src/app.module.ts` | Importar modulos + ScheduleModule |
| `backend/src/modules/auth/auth.service.ts` | Esqueci/redefinir senha + registro |
| `backend/src/modules/auth/auth.controller.ts` | Rotas novas |
| `backend/src/modules/ordens/ordens.service.ts` | Check assinatura antes de criar OS |
| `backend/src/modules/usuarios/usuarios.service.ts` | Check limite usuarios |
| `backend/src/modules/empresas/empresas.service.ts` | getDashboardStats() |
| `backend/src/modules/empresas/empresas.controller.ts` | Endpoint dashboard |
| `backend/src/modules/email/email.service.ts` | Template reset senha |
| `frontend/src/app/app.routes.ts` | Rotas novas |
| `frontend/src/app/features/admin/admin.routes.ts` | /admin/dashboard |
| `frontend/src/app/features/admin/admin-layout.component.html` | Link Dashboard |
| `frontend/src/app/features/landing/landing.component.html` | Botao "Criar conta" |
| `backend/package.json` | @nestjs/schedule |

---

## 6. Ordem de Implementacao

1. **Schema + migracao** — Plano, Assinatura, ResetSenha, remover campos antigos
2. **Planos** — CRUD backend + seed dos 3 planos
3. **Assinaturas** — Service + cron de vencimento
4. **Self-service** — Endpoint registro + tela /cadastro
5. **Enforcement** — Bloqueio de OS + limite de usuarios
6. **Reset de senha** — Backend + templates + telas
7. **Dashboard SUPERADMIN** — Endpoint + tela /admin/dashboard
