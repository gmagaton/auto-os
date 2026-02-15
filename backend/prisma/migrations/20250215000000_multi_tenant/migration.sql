-- CreateEnum
CREATE TYPE "StatusEmpresa" AS ENUM ('ATIVA', 'SUSPENSA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "status" "StatusEmpresa" NOT NULL DEFAULT 'ATIVA',
    "dataVencimento" TIMESTAMP(3),
    "plano" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_slug_key" ON "Empresa"("slug");

-- AlterEnum: Add SUPERADMIN to Papel
ALTER TYPE "Papel" ADD VALUE 'SUPERADMIN';

-- InsertDefaultEmpresa
INSERT INTO "Empresa" ("id", "nome", "slug", "status", "criadoEm", "atualizadoEm")
VALUES ('default-empresa', 'Oficina Padrao', 'oficina-padrao', 'ATIVA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AddColumn: empresaId to all tenant-scoped tables (nullable initially)
ALTER TABLE "Usuario" ADD COLUMN "empresaId" TEXT;
ALTER TABLE "Cliente" ADD COLUMN "empresaId" TEXT;
ALTER TABLE "Veiculo" ADD COLUMN "empresaId" TEXT;
ALTER TABLE "OrdemServico" ADD COLUMN "empresaId" TEXT;
ALTER TABLE "Servico" ADD COLUMN "empresaId" TEXT;
ALTER TABLE "Foto" ADD COLUMN "empresaId" TEXT;
ALTER TABLE "ChecklistPreenchido" ADD COLUMN "empresaId" TEXT;
ALTER TABLE "HistoricoStatus" ADD COLUMN "empresaId" TEXT;

-- Backfill: set empresaId to default-empresa for all existing rows
UPDATE "Usuario" SET "empresaId" = 'default-empresa' WHERE "empresaId" IS NULL;
UPDATE "Cliente" SET "empresaId" = 'default-empresa' WHERE "empresaId" IS NULL;
UPDATE "Veiculo" SET "empresaId" = 'default-empresa' WHERE "empresaId" IS NULL;
UPDATE "OrdemServico" SET "empresaId" = 'default-empresa' WHERE "empresaId" IS NULL;
UPDATE "Servico" SET "empresaId" = 'default-empresa' WHERE "empresaId" IS NULL;
UPDATE "Foto" SET "empresaId" = 'default-empresa' WHERE "empresaId" IS NULL;
UPDATE "ChecklistPreenchido" SET "empresaId" = 'default-empresa' WHERE "empresaId" IS NULL;
UPDATE "HistoricoStatus" SET "empresaId" = 'default-empresa' WHERE "empresaId" IS NULL;

-- MakeNotNull: set empresaId as NOT NULL on all tables
ALTER TABLE "Usuario" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "Cliente" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "Veiculo" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "OrdemServico" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "Servico" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "Foto" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "ChecklistPreenchido" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "HistoricoStatus" ALTER COLUMN "empresaId" SET NOT NULL;

-- AddForeignKey: empresaId references Empresa(id)
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Veiculo" ADD CONSTRAINT "Veiculo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChecklistPreenchido" ADD CONSTRAINT "ChecklistPreenchido_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HistoricoStatus" ADD CONSTRAINT "HistoricoStatus_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropIndex: remove old single-column unique index on Usuario.email
DROP INDEX "Usuario_email_key";

-- CreateIndex: compound unique on Usuario(email, empresaId)
CREATE UNIQUE INDEX "Usuario_email_empresaId_key" ON "Usuario"("email", "empresaId");

-- CreateIndex: performance indexes on empresaId for all tenant-scoped tables
CREATE INDEX "Usuario_empresaId_idx" ON "Usuario"("empresaId");
CREATE INDEX "Cliente_empresaId_idx" ON "Cliente"("empresaId");
CREATE INDEX "Veiculo_empresaId_idx" ON "Veiculo"("empresaId");
CREATE INDEX "OrdemServico_empresaId_idx" ON "OrdemServico"("empresaId");
CREATE INDEX "Servico_empresaId_idx" ON "Servico"("empresaId");
CREATE INDEX "Foto_empresaId_idx" ON "Foto"("empresaId");
CREATE INDEX "ChecklistPreenchido_empresaId_idx" ON "ChecklistPreenchido"("empresaId");
CREATE INDEX "HistoricoStatus_empresaId_idx" ON "HistoricoStatus"("empresaId");
