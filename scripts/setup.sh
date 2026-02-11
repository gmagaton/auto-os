#!/bin/bash
# scripts/setup.sh
# Auto-OS Development Setup Script

set -e

echo "=========================================="
echo "  Auto-OS Development Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Backend setup
echo -e "${YELLOW}[1/5] Installing backend dependencies...${NC}"
cd backend
npm install
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}Created .env from template${NC}"
else
    echo ".env already exists, skipping"
fi
cd ..

# Frontend setup
echo -e "${YELLOW}[2/5] Installing frontend dependencies...${NC}"
cd frontend
npm install
cd ..

# Start database
echo -e "${YELLOW}[3/5] Starting PostgreSQL container...${NC}"
docker-compose up -d postgres

echo "Waiting for database to be ready..."
sleep 5

# Run migrations
echo -e "${YELLOW}[4/5] Running database migrations...${NC}"
cd backend
npx prisma migrate dev --name init 2>/dev/null || npx prisma migrate deploy

# Seed database
echo -e "${YELLOW}[5/5] Seeding database...${NC}"
npx prisma db seed || echo "Seed already applied or failed"

cd ..

echo ""
echo -e "${GREEN}=========================================="
echo "  Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "To start development:"
echo "  Backend:  cd backend && npm run start:dev"
echo "  Frontend: cd frontend && npm start"
echo ""
echo "Or use: npm run dev (from project root)"
