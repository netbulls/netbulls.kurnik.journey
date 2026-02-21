#!/usr/bin/env bash
set -euo pipefail

# Kurnik Journey — Deploy to VPS
# Usage: ./deploy.sh

SSH_HOST="${SSH_HOST:-deploy@89.167.28.70}"
REMOTE_BASE="/opt/kurnik-journey"

echo "=== Deploying kurnik-journey ==="

# Create remote directory
ssh "$SSH_HOST" "mkdir -p $REMOTE_BASE/prod $REMOTE_BASE/site"

# Sync site files
rsync -avz --delete \
  "$(dirname "$0")/../site/" \
  "$SSH_HOST:$REMOTE_BASE/site/"

# Sync docker-compose
scp "$(dirname "$0")/prod/docker-compose.yml" "$SSH_HOST:$REMOTE_BASE/prod/"

# Start/restart container
ssh "$SSH_HOST" "cd $REMOTE_BASE/prod && docker compose up -d"

echo "=== Site deployed ==="

# Update proxy
echo "=== Updating proxy ==="
scp "$(dirname "$0")/Caddyfile.journey" "$SSH_HOST:/opt/proxy/sites-enabled/kurnik-journey.caddy"
ssh "$SSH_HOST" "docker exec proxy-caddy caddy reload --config /etc/caddy/Caddyfile"
echo "=== Proxy reloaded ==="
