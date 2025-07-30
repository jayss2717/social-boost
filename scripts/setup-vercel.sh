#!/bin/bash

# Vercel Setup Script for SocialBoost
# This script helps you set up Vercel deployment

set -e

echo "🚀 Setting up Vercel deployment for SocialBoost..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

echo "✅ Vercel CLI is ready!"

# Check if project is already linked
if [ -f ".vercel/project.json" ]; then
    echo "📋 Project is already linked to Vercel"
    echo "Project ID: $(jq -r '.projectId' .vercel/project.json)"
else
    echo "🔗 Linking project to Vercel..."
    vercel --yes
fi

echo ""
echo "📝 Next steps:"
echo "1. Set up environment variables:"
echo "   - Go to your Vercel dashboard"
echo "   - Navigate to Settings → Environment Variables"
echo "   - Add all required environment variables"
echo ""
echo "2. Deploy your application:"
echo "   vercel --prod"
echo ""
echo "3. Test your deployment:"
echo "   curl https://your-app.vercel.app/api/health"
echo ""
echo "📚 For detailed instructions, see: docs/vercel_setup_guide.md"
echo ""
echo "🎉 Setup complete! Your SocialBoost app is ready for Vercel deployment!" 