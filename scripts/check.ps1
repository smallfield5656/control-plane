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
    "docs/testing/strategy.md",
    "docs/operations/development.md",
    "agent/workflows/bootstrap.md",
    "agent/skills/project-bootstrap/SKILL.md",
    "examples/file-organizer/README.md",
    "examples/file-organizer/overview.md",
    "examples/file-organizer/requirements.md",
    "examples/file-organizer/constraints.md",
    "examples/file-organizer/adr-0001-use-tauri.md",
    "examples/file-organizer/ARCHITECTURE.md"
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

Require-Heading "agent/workflows/bootstrap.md" "## Bootstrap Completion Gate"
Require-Heading "agent/skills/project-bootstrap/SKILL.md" "## Bootstrap完了条件"
Require-Heading "examples/file-organizer/adr-0001-use-tauri.md" "## Context"
Require-Heading "examples/file-organizer/adr-0001-use-tauri.md" "## Decision"
Require-Heading "examples/file-organizer/adr-0001-use-tauri.md" "## Consequences"

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

if (Test-Path "package.json") {
    $package = Get-Content "package.json" -Raw | ConvertFrom-Json
    $scripts = @()
    if ($null -ne $package.scripts) {
        $scripts = @($package.scripts.PSObject.Properties.Name)
    }

    $packageManager =
        if (Test-Path "pnpm-lock.yaml") { "pnpm" }
        elseif (Test-Path "yarn.lock") { "yarn" }
        else { "npm" }

    foreach ($scriptName in @("lint", "typecheck", "test", "build")) {
        if ($scripts -contains $scriptName) {
            if ($packageManager -eq "npm") {
                Invoke-Step $scriptName { npm run $scriptName }
            } else {
                Invoke-Step $scriptName { & $packageManager $scriptName }
            }
        }
    }
}

Write-Host "`nValidation complete."
