#!/usr/bin/env bash
cd "$(dirname "$0")"
if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js bulunamadı. Lütfen https://nodejs.org adresinden Node.js LTS kurun."
  exit 1
fi
[ -d node_modules ] || npm install
npm start
