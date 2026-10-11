$ErrorActionPreference = "Stop"

function Invoke-Step {
    param(
        [Parameter(Mandatory=$true)][string]$Name,
        [Parameter(Mandatory=$true)][scriptblock]$Command
    )

    Write-Host "`n==> $Name"
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE"
    }
}

function Require-Heading {
    param(
        [Parameter(Mandatory=$true)][string]$Path,
        [Parameter(Mandatory=$true)][string]$Heading
    )

    $lines = Get-Content $Path
    if (-not ($lines -contains $Heading)) {
        throw "Missing heading '$Heading' in $Path"
    }
}

$requiredFiles = @(
    "AGENTS.md",
    "ARCHITECTURE.md",
    "docs/product/overview.md",
    "docs/product/requirements.md",
    "docs/product/constraints.md",
    "docs/delivery/charter.md",
    "docs/delivery/estimate.md",
    "docs/delivery/risks.md",
    "docs/delivery/milestones.md",
    "docs/testing/strategy.md",
    "docs/operations/development.md",
    "agent/workflows/bootstrap.md",
    "agent/workflows/issue.md",
    ".agents/skills/project-bootstrap/SKILL.md",
    ".github/ISSUE_TEMPLATE/feature.yml",
    ".github/ISSUE_TEMPLATE/bug.yml",
    ".github/ISSUE_TEMPLATE/investigation.yml",
    ".github/pull_request_template.md",
    "template/examples/file-organizer/README.md",
    "template/examples/file-organizer/overview.md",
    "template/examples/file-organizer/requirements.md",
    "template/examples/file-organizer/constraints.md",
    "template/examples/file-organizer/adr-0001-use-tauri.md",
    "template/examples/file-organizer/ARCHITECTURE.md"
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        throw "Required file is missing: $file"
    }
}

Write-Host "Required structure: OK"

foreach ($heading in @("## Problem", "## Users", "## Goals", "## Non-Goals", "## Success Criteria")) {
    Require-Heading "docs/product/overview.md" $heading
}

foreach ($heading in @("## Problem", "## Expected Outcome", "## Scope", "## Stakeholders", "## Budget Guardrail", "## Decision Gates")) {
    Require-Heading "docs/delivery/charter.md" $heading
}

foreach ($heading in @("## Confidence", "## Assumptions", "## Delivery Effort", "## Rate", "## Initial Cost", "## Running Cost", "## Total Estimate")) {
    Require-Heading "docs/delivery/estimate.md" $heading
}

Require-Heading "docs/delivery/risks.md" "## Risk Register"
Require-Heading "docs/delivery/milestones.md" "## Milestone Plan"
Require-Heading "docs/testing/strategy.md" "## Test Placement"
Require-Heading "docs/operations/development.md" "## Review"
Require-Heading "docs/operations/development.md" "## Security Review Triggers"
Require-Heading "docs/operations/development.md" "## CI"
Require-Heading "agent/workflows/bootstrap.md" "## Bootstrap Preparation Gate"
Require-Heading "agent/workflows/bootstrap.md" "## Bootstrap Completion Gate"
Require-Heading "agent/workflows/issue.md" "## 4. Impact Analysis"
Require-Heading ".agents/skills/project-bootstrap/SKILL.md" "## Bootstrap Preparation Complete"
Require-Heading ".agents/skills/project-bootstrap/SKILL.md" "## Bootstrap完了条件"
Require-Heading "template/examples/file-organizer/adr-0001-use-tauri.md" "## Context"
Require-Heading "template/examples/file-organizer/adr-0001-use-tauri.md" "## Decision"
Require-Heading "template/examples/file-organizer/adr-0001-use-tauri.md" "## Consequences"

Write-Host "Document shape: OK"

Get-ChildItem "docs/architecture/adr" -File -Filter "*.md" | ForEach-Object {
    if ($_.Name -in @("README.md", "0000-template.md")) {
        return
    }
    if ($_.Name -notmatch '^[0-9]{4}-[a-z0-9][a-z0-9-]*\.md$') {
        throw "Invalid ADR filename: $($_.FullName). Expected: NNNN-kebab-case.md"
    }
}

Write-Host "ADR naming: OK"

# The template repository intentionally contains TODO placeholders.
# After Bootstrap replaces the root README with a project-specific README,
# TODO markers in durable project docs mean the Bootstrap is incomplete.
$firstReadmeLine = if (Test-Path "README.md") { Get-Content "README.md" -TotalCount 1 } else { "" }
if ($firstReadmeLine -ne "# control-plane") {
    $placeholderPaths = @("ARCHITECTURE.md", "docs/product", "docs/delivery")
    $matches = @()
    foreach ($path in $placeholderPaths) {
        if (Test-Path $path) {
            $matches += Get-ChildItem $path -Recurse -File -Filter "*.md" | Select-String -CaseSensitive -Pattern '(^|[^A-Za-z0-9_])TODO([^A-Za-z0-9_]|$)'
        }
    }
    if ($matches.Count -gt 0) {
        $matches | ForEach-Object { Write-Host $_ }
        throw "Bootstrap placeholders remain in project documentation."
    }
    Write-Host "Bootstrap placeholders: OK"
}

if (Test-Path "scripts/check-project.ps1") {
    Invoke-Step "project validation (PowerShell)" { & "scripts/check-project.ps1" }
}

Write-Host "`nValidation complete."
