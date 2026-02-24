#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example."
else
  echo ".env.local already exists."
fi

echo ""
echo "Fill in your Supabase keys in .env.local."
echo "Get them from: Supabase → Project Settings → API → Project URL / anon public key / service_role key"
echo ""
echo "Opening .env.local in your editor..."
if command -v code >/dev/null 2>&1; then
  code .env.local 2>/dev/null || true
elif [ "$(uname)" = "Darwin" ]; then
  open -a "Visual Studio Code" .env.local 2>/dev/null || open .env.local 2>/dev/null || true
else
  echo "Open .env.local manually in your editor."
fi
echo ""
echo "When done, run: npm run check:env"
exit 0
