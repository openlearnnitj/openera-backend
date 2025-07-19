#!/bin/bash

# Quick health check script
echo "🏥 Running Open Era Backend Health Check..."

# Check if server is running
if curl -f -s http://localhost:3000/ping > /dev/null; then
    echo "✅ Server is running"
    
    # Get server response
    response=$(curl -s http://localhost:3000/ping)
    echo "📡 Server response: $response"
    
    # Check documentation
    if curl -f -s http://localhost:3000/docs > /dev/null; then
        echo "✅ Documentation is accessible"
    else
        echo "⚠️  Documentation might not be available"
    fi
    
    # Check API health
    if curl -f -s http://localhost:3000/api/v1/health > /dev/null; then
        echo "✅ API health endpoint is working"
        
        # Get health details
        health=$(curl -s http://localhost:3000/api/v1/health)
        echo "🔍 Health details: $health"
    else
        echo "⚠️  API health endpoint not responding"
    fi
    
else
    echo "❌ Server is not running on http://localhost:3000"
    echo "💡 Try starting with: npm run dev"
    exit 1
fi

echo "🎉 Health check completed!"
