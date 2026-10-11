#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "AGENTS.md"
  "ARCHITECTURE.md"
  "docs/product/overview.md"
  "docs/product/requirements.md"
  "docs/product/constraints.md"
  "docs/delivery/charter.md"
  "docs/delivery/estimate.md"
  "docs/delivery/risks.md"
  "docs/delivery/milestones.md"
  "docs/testing/strategy.md"
  "docs/operations/development.md"
  "agent/workflows/bootstrap.md"
  "agent/workflows/issue.md"
  ".agents/skills/project-bootstrap/SKILL.md"
  ".github/ISSUE_TEMPLATE/feature.yml"
  ".github/ISSUE_TEMPLATE/bug.yml"
  ".github/ISSUE_TEMPLATE/investigation.yml"
  ".github/pull_request_template.md"
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

for heading in "## Problem" "## Expected Outcome" "## Scope" "## Stakeholders" "## Budget Guardrail" "## Decision Gates"; do
  require_heading "docs/delivery/charter.md" "$heading"
done

for heading in "## Confidence" "## Assumptions" "## Delivery Effort" "## Rate" "## Initial Cost" "## Running Cost" "## Total Estimate"; do
  require_heading "docs/delivery/estimate.md" "$heading"
done

require_heading "docs/delivery/risks.md" "## Risk Register"
require_heading "docs/delivery/milestones.md" "## Milestone Plan"
require_heading "docs/testing/strategy.md" "## Test Placement"
require_heading "docs/operations/development.md" "## Review"
require_heading "docs/operations/development.md" "## Security Review Triggers"
require_heading "docs/operations/development.md" "## CI"
require_heading "agent/workflows/bootstrap.md" "## Bootstrap Preparation Gate"
require_heading "agent/workflows/bootstrap.md" "## Bootstrap Completion Gate"
require_heading "agent/workflows/issue.md" "## 4. Impact Analysis"
require_heading ".agents/skills/project-bootstrap/SKILL.md" "## Bootstrap Preparation Complete"
require_heading ".agents/skills/project-bootstrap/SKILL.md" "## Bootstrap完了条件"

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

# The template repository intentionally contains TODO placeholders.
# Once README.md is replaced with a project-specific README during Bootstrap,
# remaining TODO markers in durable project docs indicate an incomplete Bootstrap.
if [[ "$(head -n 1 README.md 2>/dev/null || true)" != "# control-plane" ]]; then
  placeholder_paths=(
    "ARCHITECTURE.md"
    "docs/product"
    "docs/delivery"
  )
  if grep -RInE --include='*.md' '(^|[^A-Za-z0-9_])TODO([^A-Za-z0-9_]|$)' "${placeholder_paths[@]}"; then
    echo "Bootstrap placeholders remain in project documentation." >&2
    exit 1
  fi
  echo "Bootstrap placeholders: OK"
fi

if [[ -f "scripts/check-project.sh" ]]; then
  echo "==> project validation (shell)"
  bash "scripts/check-project.sh"
fi

echo "Validation complete."
