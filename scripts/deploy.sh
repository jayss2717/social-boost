#!/bin/bash

# SocialBoost Production Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
APP_NAME="socialboost"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build the application
echo "🔨 Building application..."
npm run build

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "⚙️  Generating Prisma client..."
npx prisma generate

# Run tests
echo "🧪 Running tests..."
npm run test:app

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf "deploy_${TIMESTAMP}.tar.gz" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=.env.local \
    --exclude=deploy_*.tar.gz \
    .

echo "✅ Deployment package created: deploy_${TIMESTAMP}.tar.gz"

# Optional: Deploy to hosting platform
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🌐 Deploying to production..."
    
    # Add your deployment commands here
    # Examples:
    # - Vercel: vercel --prod
    # - Netlify: netlify deploy --prod
    # - Railway: railway up
    # - Heroku: git push heroku main
    
    echo "📋 Manual deployment steps:"
    echo "1. Upload deploy_${TIMESTAMP}.tar.gz to your hosting platform"
    echo "2. Set environment variables in your hosting platform"
    echo "3. Run database migrations on production"
    echo "4. Configure webhooks in Shopify Partner Dashboard"
    echo "5. Test the application"
fi

echo "🎉 Deployment script completed!"
echo "📋 Next steps:"
echo "   - Configure production environment variables"
echo "   - Set up monitoring and logging"
echo "   - Configure webhooks for production"
echo "   - Test all features in production environment" 