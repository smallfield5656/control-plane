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
  "agent/skills/project-bootstrap/SKILL.md"
  "examples/file-organizer/README.md"
  "examples/file-organizer/overview.md"
  "examples/file-organizer/requirements.md"
  "examples/file-organizer/constraints.md"
  "examples/file-organizer/adr-0001-use-tauri.md"
  "examples/file-organizer/ARCHITECTURE.md"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Required file is missing: $file" >&2
    exit 1
  fi
done

echo "Required structure: OK"

require_heading() {
  local file="$1"
  local heading="$2"
  if ! grep -Fxq "$heading" "$file"; then
    echo "Missing heading '$heading' in $file" >&2
    exit 1
  fi
}

for heading in "## Problem" "## Users" "## Goals" "## Non-Goals" "## Success Criteria"; do
  require_heading "docs/product/overview.md" "$heading"
done

require_heading "agent/workflows/bootstrap.md" "## Bootstrap Completion Gate"
require_heading "agent/skills/project-bootstrap/SKILL.md" "## Bootstrap完了条件"
require_heading "examples/file-organizer/adr-0001-use-tauri.md" "## Context"
require_heading "examples/file-organizer/adr-0001-use-tauri.md" "## Decision"
require_heading "examples/file-organizer/adr-0001-use-tauri.md" "## Consequences"

echo "Document shape: OK"

while IFS= read -r adr; do
  name="$(basename "$adr")"
  if [[ "$name" == "README.md" || "$name" == "0000-template.md" ]]; then
    continue
  fi
  if [[ ! "$name" =~ ^[0-9]{4}-[a-z0-9][a-z0-9-]*\.md$ ]]; then
    echo "Invalid ADR filename: $adr" >&2
    echo "Expected: NNNN-kebab-case.md" >&2
    exit 1
  fi
done < <(find docs/architecture/adr -maxdepth 1 -type f -name '*.md' | sort)

echo "ADR naming: OK"

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
