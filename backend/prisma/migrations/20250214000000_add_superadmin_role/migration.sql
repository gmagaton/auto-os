-- AlterEnum: Add SUPERADMIN to Papel
-- This must be in its own migration because ALTER TYPE ADD VALUE cannot run inside a transaction in PostgreSQL
ALTER TYPE "Papel" ADD VALUE 'SUPERADMIN';
