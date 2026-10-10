$ErrorActionPreference = "Stop"

Push-Location "packages/cli"
try {
    npm test
    if ($LASTEXITCODE -ne 0) { throw "CLI validation failed with exit code $LASTEXITCODE" }
}
finally {
    Pop-Location
}

Push-Location "template"
try {
    & "scripts/check.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Template validation failed with exit code $LASTEXITCODE" }
}
finally {
    Pop-Location
}
