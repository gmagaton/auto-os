-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ADMIN', 'ATENDENTE');

-- CreateEnum
CREATE TYPE "TipoServico" AS ENUM ('SERVICO', 'ADICIONAL');

-- CreateEnum
CREATE TYPE "StatusOS" AS ENUM ('AGUARDANDO', 'APROVADO', 'AGENDADO', 'EM_ANDAMENTO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "TipoFoto" AS ENUM ('ENTRADA', 'PROGRESSO', 'FINAL');

-- CreateEnum
CREATE TYPE "StatusChecklist" AS ENUM ('OK', 'DEFEITO', 'NAO_APLICA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'ATENDENTE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "documento" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fabricante" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fabricante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modelo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fabricanteId" TEXT NOT NULL,

    CONSTRAINT "Modelo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Veiculo" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "ano" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modeloId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,

    CONSTRAINT "Veiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servico" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoServico" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemServico" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "StatusOS" NOT NULL DEFAULT 'AGUARDANDO',
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "dataAgendada" TIMESTAMP(3),
    "aprovadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "OrdemServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoStatus" (
    "id" TEXT NOT NULL,
    "statusDe" "StatusOS",
    "statusPara" "StatusOS" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordemId" TEXT NOT NULL,
    "usuarioId" TEXT,

    CONSTRAINT "HistoricoStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemOrcamento" (
    "id" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "ordemId" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,

    CONSTRAINT "ItemOrcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Foto" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" "TipoFoto" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordemId" TEXT NOT NULL,

    CONSTRAINT "Foto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemChecklist" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistPreenchido" (
    "id" TEXT NOT NULL,
    "status" "StatusChecklist" NOT NULL,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordemId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "ChecklistPreenchido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Fabricante_nome_key" ON "Fabricante"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Modelo_fabricanteId_nome_key" ON "Modelo"("fabricanteId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServico_token_key" ON "OrdemServico"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistPreenchido_ordemId_itemId_key" ON "ChecklistPreenchido"("ordemId", "itemId");

-- AddForeignKey
ALTER TABLE "Modelo" ADD CONSTRAINT "Modelo_fabricanteId_fkey" FOREIGN KEY ("fabricanteId") REFERENCES "Fabricante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Veiculo" ADD CONSTRAINT "Veiculo_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "Modelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Veiculo" ADD CONSTRAINT "Veiculo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoStatus" ADD CONSTRAINT "HistoricoStatus_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoStatus" ADD CONSTRAINT "HistoricoStatus_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemOrcamento" ADD CONSTRAINT "ItemOrcamento_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemOrcamento" ADD CONSTRAINT "ItemOrcamento_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistPreenchido" ADD CONSTRAINT "ChecklistPreenchido_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistPreenchido" ADD CONSTRAINT "ChecklistPreenchido_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemChecklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistPreenchido" ADD CONSTRAINT "ChecklistPreenchido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
