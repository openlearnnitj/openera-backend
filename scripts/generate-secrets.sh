#!/bin/bash

# Generate secure secrets for production deployment

echo "🔐 Generating secure secrets for Open Era Backend..."
echo ""

echo "JWT_SECRET (copy this to your environment variables):"
openssl rand -base64 48
echo ""

echo "JWT_REFRESH_SECRET (copy this to your environment variables):"
openssl rand -base64 48
echo ""

echo "🔒 Security Notes:"
echo "  - These secrets should be different"
echo "  - Store them securely in your deployment platform"
echo "  - Never commit them to version control"
echo "  - Changing them will invalidate all existing tokens"
echo ""

echo "📋 Copy these to your Render environment variables:"
echo "  1. Go to your Render service dashboard"
echo "  2. Navigate to Environment tab"
echo "  3. Add JWT_SECRET and JWT_REFRESH_SECRET"
echo "  4. Use the values generated above"
