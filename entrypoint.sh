#!/bin/sh
set -e

required_vars="DATABASE_URL AUTH_SECRET"
missing=""
for var in $required_vars; do
  val=$(eval echo "\$$var")
  if [ -z "$val" ]; then
    missing="$missing $var"
  fi
done

if [ -n "$missing" ]; then
  echo ""
  echo "ERROR: Missing required environment variables:$missing"
  echo "  Set them in your .env file or pass them via docker-compose."
  echo "  See .env.example for a full list of required variables."
  echo ""
  exit 1
fi

echo "✓ Required env vars present. Starting PostForge..."
exec "$@"
