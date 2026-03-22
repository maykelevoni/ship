#!/bin/bash
# Deploy script for PostForge on Hetzner VPS
# Run: bash deploy.sh
set -e

echo "Deploying PostForge..."

# Pull latest code
git pull origin main

# Copy env template if .env does not exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "  .env created from .env.example."
  echo "  Edit .env with your API keys before the app can function:"
  echo ""
  echo "    DATABASE_URL        — Neon PostgreSQL connection string"
  echo "    AUTH_SECRET         — Random secret for Auth.js sessions"
  echo "    ANTHROPIC_API_KEY   — Claude API key for content generation"
  echo "    GEMINI_API_KEY      — Google Gemini key for image generation"
  echo "    POSTBRIDGE_API_KEY  — post-bridge key for social posting"
  echo "    RESEND_API_KEY      — Resend key for email newsletters"
  echo "    NEXT_PUBLIC_APP_URL — Public URL of this VPS (e.g. http://1.2.3.4:3000)"
  echo ""
  echo "  After editing .env, re-run: bash deploy.sh"
  exit 0
fi

# Build and start (or restart) containers
docker compose up --build -d

echo ""
echo "PostForge is running at http://localhost:3000"
echo "Logs: docker compose logs -f"
