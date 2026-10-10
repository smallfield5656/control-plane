#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "AGENTS.md"
  "ARCHITECTURE.md"
  "docs/product/overview.md"
  "docs/product/requirements.md"
  "docs/product/constraints.md"
  "docs/testing/strategy.md"
  "docs/operations/development.md"
  "agent/workflows/bootstrap.md"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Required source-of-truth file is missing: $file" >&2
    exit 1
  fi
done

echo "SSOT structure: OK"

if [[ -f package.json ]]; then
  if [[ -f pnpm-lock.yaml ]]; then
    pm="pnpm"
  elif [[ -f yarn.lock ]]; then
    pm="yarn"
  else
    pm="npm"
  fi

  for script in lint typecheck test build; do
    if node -e "const p=require('./package.json'); process.exit(p.scripts?.['$script'] ? 0 : 1)"; then
      echo "==> $script"
      if [[ "$pm" == "npm" ]]; then
        npm run "$script"
      else
        "$pm" "$script"
      fi
    fi
  done
fi

echo "Validation complete."
