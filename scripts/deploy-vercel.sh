#!/bin/bash

# Vercel Deployment Script for Evolyte Backend
# This script helps you deploy to Vercel with proper checks

echo "🚀 Evolyte Backend - Vercel Deployment Script"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found!${NC}"
    echo ""
    echo "Install it with: npm install -g vercel"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI found${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
    echo "Make sure to configure environment variables in Vercel dashboard"
    echo ""
fi

# Run tests first
echo -e "${BLUE}🧪 Running tests...${NC}"
if npm test; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
else
    echo -e "${RED}❌ Tests failed!${NC}"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher${NC}"
    echo "Current version: $(node -v)"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Node.js version OK: $(node -v)${NC}"
echo ""

# Ask deployment type
echo "Select deployment type:"
echo "1) Preview deployment (test before production)"
echo "2) Production deployment"
echo ""
read -p "Enter choice (1 or 2): " DEPLOY_TYPE
echo ""

if [ "$DEPLOY_TYPE" = "2" ]; then
    echo -e "${YELLOW}⚠️  Production Deployment${NC}"
    echo ""
    echo "This will deploy to production. Make sure:"
    echo "  ✅ All tests pass"
    echo "  ✅ Environment variables are set in Vercel"
    echo "  ✅ MongoDB connection string is correct"
    echo "  ✅ You've reviewed the changes"
    echo ""
    read -p "Continue with production deployment? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    
    echo ""
    echo -e "${BLUE}🚀 Deploying to production...${NC}"
    vercel --prod
else
    echo -e "${BLUE}🚀 Creating preview deployment...${NC}"
    vercel
fi

echo ""
echo -e "${GREEN}✅ Deployment initiated!${NC}"
echo ""
echo "Next steps:"
echo "1. Wait for deployment to complete"
echo "2. Check deployment logs in Vercel dashboard"
echo "3. Test your API endpoints"
echo "4. Visit /api-docs to see your API documentation"
echo ""
echo "Useful commands:"
echo "  vercel logs          - View deployment logs"
echo "  vercel domains       - Manage domains"
echo "  vercel env           - Manage environment variables"
echo ""
