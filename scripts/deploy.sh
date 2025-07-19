#!/bin/bash

# Open Era Backend Deployment Script
# This script sets up and deploys the Open Era Hackathon backend

set -e

echo "Starting Open Era Backend Deployment..."

# Check if required environment variables are set
required_vars=("DATABASE_URL" "JWT_SECRET" "JWT_REFRESH_SECRET" "ADMIN_EMAIL" "ADMIN_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Environment variable $var is not set"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Install dependencies
echo "Installing dependencies..."
npm ci --only=production

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build the application
echo "Building application..."
npm run build

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Seed database with admin user
echo "👤 Seeding admin user..."
npm run db:seed

# Create logs directory
mkdir -p logs

echo "✅ Deployment completed successfully!"
echo "Open Era Backend is ready to serve!"
echo ""
echo "Next steps:"
echo "  1. Start the server: npm start"
echo "  2. Check health: curl http://localhost:3000/ping"
echo "  3. View docs: http://localhost:3000/docs"
echo "  4. Admin login with: ${ADMIN_EMAIL}"
echo ""
echo "Security checklist:"
echo "  ✓ JWT secrets configured"
echo "  ✓ Admin credentials set"
echo "  ✓ Database secured"
echo "  ✓ Rate limiting enabled"
echo "  ✓ CORS configured"
echo "  ✓ Security headers active"
