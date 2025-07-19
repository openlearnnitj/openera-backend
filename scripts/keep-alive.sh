#!/bin/bash

# Keep-alive script for Render free instance
# This script pings the server every 30 seconds to prevent it from sleeping

# Get the server URL from environment or use default
SERVER_URL="${RENDER_EXTERNAL_URL:-https://your-app-name.onrender.com}"
PING_ENDPOINT="/ping"
FULL_URL="${SERVER_URL}${PING_ENDPOINT}"

# Log file for debugging
LOG_FILE="/tmp/keep-alive.log"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to ping the server
ping_server() {
    local response=$(curl -s -w "%{http_code}" -o /dev/null --max-time 10 "$FULL_URL")
    
    if [ "$response" = "200" ]; then
        log "✓ Server is alive (HTTP $response)"
        return 0
    else
        log "✗ Server ping failed (HTTP $response)"
        return 1
    fi
}

# Main execution
log "Starting keep-alive ping to: $FULL_URL"

# Ping the server
if ping_server; then
    log "Keep-alive ping successful"
    exit 0
else
    log "Keep-alive ping failed"
    exit 1
fi
