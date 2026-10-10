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

$requiredFiles = @(
    "AGENTS.md",
    "ARCHITECTURE.md",
    "docs/product/overview.md",
    "docs/product/requirements.md",
    "docs/product/constraints.md",
    "docs/testing/strategy.md",
    "docs/operations/development.md",
    "agent/workflows/bootstrap.md"
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        throw "Required source-of-truth file is missing: $file"
    }
}

Write-Host "SSOT structure: OK"

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
