#!/bin/bash
# scripts/generate-secrets.sh
# Generate secure secrets for production deployment

echo "=========================================="
echo "  Auto-OS Production Secrets Generator"
echo "=========================================="
echo ""

# Generate JWT Secret
JWT_SECRET=$(openssl rand -base64 32)

echo "Copy these values to your Render environment variables:"
echo ""
echo "----------------------------------------"
echo "JWT_SECRET=$JWT_SECRET"
echo "----------------------------------------"
echo ""
echo "IMPORTANT: Never commit these values to git!"
echo "Add them directly in the Render dashboard."
