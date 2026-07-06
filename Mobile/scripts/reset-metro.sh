#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Stopping Metro / Expo bundlers on ports 8081–8083..."
for port in 8081 8082 8083; do
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  port $port -> kill $pids"
    kill -9 $pids 2>/dev/null || true
  fi
done

echo "Clearing Metro / NativeWind caches..."
rm -rf node_modules/react-native-css-interop/.cache 2>/dev/null || true
rm -rf "$TMPDIR"/metro-* "$TMPDIR"/haste-map-* 2>/dev/null || true
rm -rf "${TMPDIR:-/tmp}"/metro-cache-* 2>/dev/null || true

if command -v watchman >/dev/null 2>&1; then
  watchman watch-del "$ROOT" 2>/dev/null || true
  watchman watch-project "$ROOT" 2>/dev/null || true
fi

echo "Done. Start a single bundler with: npm start"
