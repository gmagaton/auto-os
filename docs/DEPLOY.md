# Guia de Deploy - Auto OS

Este guia detalha o processo completo de deploy do Auto OS utilizando serviços gratuitos.

---

## Arquitetura de Producao

```
                                    ARQUITETURA AUTO OS
    +------------------------------------------------------------------------+
    |                                                                        |
    |     +----------+          +----------+          +----------+           |
    |     |          |   HTTPS  |          |   HTTPS  |          |           |
    |     |  Usuario | -------> |  Vercel  | -------> |  Render  |           |
    |     | (Browser)|          | Frontend |          | Backend  |           |
    |     |          |          | (Angular)|          | (NestJS) |           |
    |     +----------+          +----------+          +----+-----+           |
    |                                                      |                 |
    |                                                      |                 |
    |                           +----------+               |                 |
    |                           |          |               |                 |
    |                           |   Neon   | <-------------+                 |
    |                           | Postgres |               |                 |
    |                           |          |               |                 |
    |                           +----------+               |                 |
    |                                                      |                 |
    |                           +----------+               |                 |
    |                           |          |               |                 |
    |                           |Cloudinary| <-------------+                 |
    |                           | (Imagens)|                                 |
    |                           |          |                                 |
    |                           +----------+                                 |
    |                                                                        |
    +------------------------------------------------------------------------+
```

### Fluxo de Dados

1. **Usuario** acessa o frontend via navegador
2. **Vercel** serve a aplicacao Angular (SPA)
3. Requisicoes `/api/*` sao redirecionadas para o **Render**
4. **Render** processa a logica de negocios (NestJS + Docker)
5. **Neon** armazena os dados (PostgreSQL serverless)
6. **Cloudinary** armazena as imagens (fotos de veiculos)

---

## Pre-requisitos

### Contas Necessarias

| Servico    | URL                          | Funcao                  |
|------------|------------------------------|-------------------------|
| GitHub     | https://github.com           | Repositorio de codigo   |
| Vercel     | https://vercel.com           | Hospedagem do frontend  |
| Render     | https://render.com           | Hospedagem do backend   |
| Neon       | https://neon.tech            | Banco de dados Postgres |
| Cloudinary | https://cloudinary.com       | Armazenamento de imagens|

### Repositorio GitHub

Certifique-se de que o codigo esta em um repositorio GitHub:

```bash
# Se ainda nao fez push
git remote add origin https://github.com/seu-usuario/auto-os.git
git branch -M main
git push -u origin main
```

---

## Passo 1: Configurar Banco de Dados (Neon)

### 1.1 Criar Conta e Projeto

1. Acesse https://neon.tech e crie uma conta
2. Clique em **"Create a project"**
3. Configure:
   - **Project name**: `auto-os`
   - **Region**: Escolha o mais proximo (ex: `US East` ou `Europe`)
   - **Postgres version**: Use a versao padrao

### 1.2 Obter Connection String

1. Apos criar o projeto, va para **Dashboard**
2. Copie a **Connection string** (formato pooled):

```
postgresql://username:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

> **Importante**: Use a connection string com `?sslmode=require`

### 1.3 Free Tier do Neon

| Recurso               | Limite Free Tier |
|-----------------------|------------------|
| Armazenamento         | 0.5 GB           |
| Compute time          | 191 horas/mes    |
| Branches              | 10               |
| Auto-suspend          | Apos 5 min       |

> **Nota**: O banco suspende automaticamente apos inatividade. A primeira requisicao pode levar ~1s para "acordar".

---

## Passo 2: Configurar Backend (Render)

### 2.1 Criar Web Service

1. Acesse https://render.com e faca login com GitHub
2. Clique em **"New +"** > **"Web Service"**
3. Conecte seu repositorio `auto-os`

### 2.2 Configuracoes do Servico

| Campo               | Valor                                    |
|---------------------|------------------------------------------|
| **Name**            | `auto-os-backend`                        |
| **Region**          | `Oregon (US West)` ou proximo ao Neon    |
| **Branch**          | `main`                                   |
| **Root Directory**  | `backend`                                |
| **Runtime**         | `Docker`                                 |

### 2.3 Environment Variables

Clique em **"Advanced"** e adicione as variaveis de ambiente:

```env
# Database (do Neon - Passo 1)
DATABASE_URL=postgresql://user:pass@host.neon.tech/neondb?sslmode=require

# Authentication (gere um secret seguro)
JWT_SECRET=gere-com-openssl-rand-base64-32
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://seu-app.vercel.app
API_URL=https://auto-os-backend.onrender.com

# Cloudinary (configurar no Passo 4)
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=seu-api-secret

# Email (opcional)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=seu-email@gmail.com
MAIL_PASS=sua-app-password
MAIL_FROM=Auto OS <noreply@seudominio.com>
```

> **Dica**: Para gerar JWT_SECRET:
> ```bash
> openssl rand -base64 32
> ```

### 2.4 Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build (primeira vez pode levar ~5-10 min)
3. Anote a URL gerada: `https://auto-os-backend.onrender.com`

### 2.5 Free Tier do Render

| Recurso               | Limite Free Tier |
|-----------------------|------------------|
| Horas de execucao     | 750 horas/mes    |
| Memoria               | 512 MB           |
| CPU                   | 0.1 vCPU         |
| Spin down             | Apos 15 min      |
| Deploys               | Ilimitados       |

> **Nota**: O servico "dorme" apos 15 min de inatividade. A primeira requisicao pode levar ~30-60s para "acordar" (cold start).

---

## Passo 3: Configurar Frontend (Vercel)

### 3.1 Importar Repositorio

1. Acesse https://vercel.com e faca login com GitHub
2. Clique em **"Add New..."** > **"Project"**
3. Selecione o repositorio `auto-os`

### 3.2 Configuracoes do Projeto

| Campo                 | Valor                              |
|-----------------------|------------------------------------|
| **Framework Preset**  | `Angular`                          |
| **Root Directory**    | `frontend`                         |
| **Build Command**     | `npm run build` (padrao)           |
| **Output Directory**  | `dist/frontend/browser`            |

### 3.3 Atualizar vercel.json

**IMPORTANTE**: Antes de fazer deploy, atualize o arquivo `frontend/vercel.json` com a URL do Render:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "angular",
  "buildCommand": "npm run build",
  "outputDirectory": "dist/frontend/browser",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://auto-os-backend.onrender.com/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

Substitua `https://auto-os-backend.onrender.com` pela URL real do seu backend no Render.

### 3.4 Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (~2-3 min)
3. Anote a URL gerada: `https://auto-os.vercel.app`

### 3.5 Atualizar Backend CORS

Apos obter a URL do Vercel, atualize a variavel `FRONTEND_URL` no Render:

1. Va para o dashboard do Render
2. Selecione o servico `auto-os-backend`
3. Va em **Environment** > **Environment Variables**
4. Atualize `FRONTEND_URL` com a URL do Vercel

### 3.6 Free Tier do Vercel

| Recurso               | Limite Free Tier |
|-----------------------|------------------|
| Bandwidth             | 100 GB/mes       |
| Builds                | 6000 min/mes     |
| Serverless Functions  | 100 GB-Hours     |
| Deployments           | Ilimitados       |

---

## Passo 4: Configurar Imagens (Cloudinary)

### 4.1 Criar Conta

1. Acesse https://cloudinary.com e crie uma conta
2. Apos login, va para **Dashboard**

### 4.2 Obter Credenciais

No dashboard, voce encontrara:

- **Cloud name**: `seu-cloud-name`
- **API Key**: `123456789012345`
- **API Secret**: `abcdefghijklmnopqrstuvwxyz`

### 4.3 Configurar no Render

Atualize as variaveis de ambiente no Render:

```env
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

### 4.4 Free Tier do Cloudinary

| Recurso               | Limite Free Tier |
|-----------------------|------------------|
| Armazenamento         | 25 GB            |
| Bandwidth             | 25 GB/mes        |
| Transformacoes        | 25000/mes        |

---

## Passo 5: Seed Inicial

Apos o primeiro deploy, execute o seed para popular o banco de dados:

### Opcao 1: Via Render Shell

1. No dashboard do Render, selecione seu servico
2. Clique em **"Shell"** no menu lateral
3. Execute:

```bash
npx prisma db seed
```

### Opcao 2: Localmente (com DATABASE_URL de producao)

```bash
cd backend
DATABASE_URL="sua-connection-string-do-neon" npx prisma db seed
```

### Dados Criados pelo Seed

O seed criara:

| Dado                  | Quantidade        |
|-----------------------|-------------------|
| Fabricantes           | 30                |
| Modelos de veiculos   | 150+              |
| Servicos              | 18                |
| Itens de checklist    | 16                |
| Usuario admin         | 1                 |

**Credenciais do Admin:**
- Email: `admin@oficina.com`
- Senha: `admin123`

> **IMPORTANTE**: Altere a senha do admin apos o primeiro login!

---

## Verificacao Pos-Deploy

### Checklist de Verificacao

Execute cada item para garantir que o deploy foi bem-sucedido:

- [ ] **Health Check do Backend**
  ```bash
  curl https://auto-os-backend.onrender.com/health
  # Esperado: {"status":"ok","timestamp":"...","database":"connected"}
  ```

- [ ] **Acessar Frontend**
  - Abra `https://auto-os.vercel.app`
  - A pagina de login deve carregar

- [ ] **Fazer Login**
  - Email: `admin@oficina.com`
  - Senha: `admin123`
  - Deve redirecionar para o dashboard

- [ ] **Criar uma OS de Teste**
  - Cadastre um cliente
  - Cadastre um veiculo
  - Crie uma ordem de servico
  - Verifique se salvou corretamente

- [ ] **Upload de Foto**
  - Na OS criada, adicione uma foto
  - Verifique se a imagem aparece corretamente
  - Confirme no Cloudinary que a imagem foi salva

- [ ] **Teste em Mobile**
  - Acesse pelo celular
  - Verifique se o layout responsivo funciona
  - Teste a navegacao touch

---

## Troubleshooting

### Backend nao inicia

**Sintoma**: Erro no build ou servico nao responde

**Verificacoes**:
1. Confira os logs no Render Dashboard
2. Verifique se todas as variaveis de ambiente estao configuradas
3. Teste a connection string do Neon separadamente

**Solucoes comuns**:
```bash
# Verifique se o Dockerfile esta correto
docker build -t test ./backend

# Verifique a connection string
psql "sua-connection-string"
```

### CORS Errors

**Sintoma**: Erros no console do browser como "CORS policy"

**Solucao**:
1. Verifique se `FRONTEND_URL` no Render esta correto
2. Confirme que a URL nao tem barra final (/)
3. Atualize e faca redeploy do backend

```env
# Correto
FRONTEND_URL=https://auto-os.vercel.app

# Incorreto
FRONTEND_URL=https://auto-os.vercel.app/
```

### Imagens nao carregam

**Sintoma**: Upload funciona mas imagens nao aparecem

**Verificacoes**:
1. Confira as credenciais do Cloudinary
2. Verifique no dashboard do Cloudinary se a imagem existe
3. Confira se a URL da imagem esta correta no banco

**Solucao**:
```bash
# Teste o Cloudinary manualmente
curl -X POST \
  -F "file=@test.jpg" \
  https://api.cloudinary.com/v1_1/SEU_CLOUD_NAME/image/upload \
  -F "upload_preset=SEU_PRESET"
```

### Cold Start lento

**Sintoma**: Primeira requisicao demora 30-60 segundos

**Explicacao**: No free tier do Render, o servico "dorme" apos 15 minutos de inatividade.

**Mitigacoes**:
1. **Aceitar o comportamento**: Primeira requisicao sera lenta
2. **Health check externo**: Configure um servico como UptimeRobot para fazer ping a cada 14 minutos
3. **Upgrade para plano pago**: Servico fica sempre ativo

**Configurar UptimeRobot (gratuito)**:
1. Crie conta em https://uptimerobot.com
2. Adicione monitor HTTP(s)
3. URL: `https://auto-os-backend.onrender.com/health`
4. Intervalo: 5 minutos

### Banco de dados nao conecta

**Sintoma**: Erro de conexao com PostgreSQL

**Verificacoes**:
1. Confirme que a connection string inclui `?sslmode=require`
2. Verifique se o projeto Neon esta ativo
3. Confirme que o IP nao esta bloqueado (Neon aceita todos por padrao)

**Solucao**:
```bash
# Teste a conexao localmente
psql "postgresql://user:pass@host.neon.tech/db?sslmode=require" -c "SELECT 1"
```

---

## Custos

### Free Tier (Custo Zero)

| Servico    | Free Tier                         | Suficiente para               |
|------------|-----------------------------------|-------------------------------|
| Vercel     | 100 GB bandwidth, builds ilimitados| Ate ~10.000 usuarios/mes     |
| Render     | 750 horas, 512 MB RAM             | 1 servico rodando 24/7        |
| Neon       | 0.5 GB, 191 compute hours         | Ate ~5.000 registros          |
| Cloudinary | 25 GB storage, 25 GB bandwidth    | Ate ~25.000 fotos             |

### Estimativa de Upgrade (se necessario)

| Servico    | Plano Pago          | Preco          | Beneficio                        |
|------------|---------------------|----------------|----------------------------------|
| Vercel     | Pro                 | $20/mes        | Mais bandwidth, analytics        |
| Render     | Starter             | $7/mes         | Sem cold start, mais RAM         |
| Neon       | Launch              | $19/mes        | 10 GB, mais compute              |
| Cloudinary | Plus                | $99/mes        | 225 GB, suporte                  |

### Quando fazer Upgrade?

- **Render**: Quando cold start for inaceitavel para usuarios
- **Neon**: Quando atingir limite de 0.5 GB
- **Cloudinary**: Quando atingir limite de 25 GB de fotos
- **Vercel**: Quando precisar de analytics ou mais performance

---

## Checklist Final de Deploy

```
[ ] 1. Criar projeto Neon e copiar connection string
[ ] 2. Criar Web Service no Render com Docker
[ ] 3. Configurar todas as variaveis de ambiente no Render
[ ] 4. Atualizar vercel.json com URL do Render
[ ] 5. Fazer commit e push das alteracoes
[ ] 6. Importar projeto no Vercel
[ ] 7. Configurar Cloudinary e adicionar credenciais no Render
[ ] 8. Executar seed do banco de dados
[ ] 9. Atualizar FRONTEND_URL no Render com URL do Vercel
[ ] 10. Fazer redeploy do backend
[ ] 11. Testar login com admin@oficina.com
[ ] 12. Alterar senha do admin
[ ] 13. Testar todas as funcionalidades
[ ] 14. (Opcional) Configurar UptimeRobot para evitar cold start
```

---

## Proximos Passos

Apos o deploy inicial:

1. **Configurar dominio customizado** (opcional)
   - Vercel: Settings > Domains
   - Render: Settings > Custom Domains

2. **Configurar SSL** (automatico em Vercel e Render)

3. **Monitoramento**
   - Render fornece metricas basicas
   - Considere adicionar Sentry para erros

4. **Backups**
   - Neon faz backup automatico (point-in-time recovery)
   - Configure exports periodicos se necessario

5. **CI/CD**
   - GitHub Actions ja configurado no repositorio
   - Push para `main` aciona deploy automatico

---

*Documentacao gerada para o projeto Auto OS*
