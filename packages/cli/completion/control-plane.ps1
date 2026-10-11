# PowerShell 7.2+. Load with: control-plane completion powershell | Out-String | Invoke-Expression
Register-ArgumentCompleter -Native -CommandName control-plane -ScriptBlock {
    param($wordToComplete, $commandAst, $cursorPosition)
    $tokens = [System.Collections.Generic.List[string]]::new()
    foreach ($element in $commandAst.CommandElements) {
        if ($element.Extent.StartOffset -ge $cursorPosition) { break }
        if ($element.Extent.EndOffset -gt $cursorPosition) { break }
        if ($element -is [System.Management.Automation.Language.StringConstantExpressionAst]) {
            $tokens.Add($element.Value)
        } else {
            $tokens.Add($element.Extent.Text)
        }
    }
    # Replace the current AST element with the prefix at the cursor, preserving completed arguments.
    if ($tokens.Count -gt 0 -and $commandAst.CommandElements.Count -gt 0) {
        $last = $commandAst.CommandElements | Where-Object { $_.Extent.EndOffset -le $cursorPosition } | Select-Object -Last 1
        if ($last -and $last.Extent.EndOffset -eq $cursorPosition -and $wordToComplete) { $tokens.RemoveAt($tokens.Count - 1) }
    }
    $prefix = $wordToComplete
    if ($prefix.StartsWith("'") -or $prefix.StartsWith('"')) { $prefix = $prefix.Substring(1) }
    if ($prefix.EndsWith("'") -or $prefix.EndsWith('"')) { $prefix = $prefix.Substring(0, $prefix.Length - 1) }
    $tokens.Add($prefix)
    try {
        $payload = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -InputObject $tokens.ToArray() -Compress)))
        $response = & control-plane completion candidates --shell powershell --index ($tokens.Count - 1) -- __control-plane-tokens-base64__ $payload 2>$null | ConvertFrom-Json -ErrorAction Stop
        if ($response.kind -eq 'directory') {
            $parent = Split-Path -Parent $prefix
            if (-not $parent) { $parent = '.' }
            $leaf = Split-Path -Leaf $prefix
            foreach ($entry in Get-ChildItem -LiteralPath $parent -Directory -ErrorAction SilentlyContinue) {
                if (-not $entry.Name.StartsWith($leaf, [System.StringComparison]::OrdinalIgnoreCase)) { continue }
                $value = Join-Path $parent $entry.Name
                $value += [System.IO.Path]::DirectorySeparatorChar
                if ($value -match "[\s'`\$;()&|\[\]{}]") { $value = "'" + $value.Replace("'", "''") + "'" }
                [System.Management.Automation.CompletionResult]::new($value, $entry.Name, 'ProviderContainer', $entry.FullName)
            }
        } else {
            foreach ($candidate in $response.candidates) {
                $description = if ($candidate.description) { $candidate.description } else { $candidate.value }
                [System.Management.Automation.CompletionResult]::new($candidate.value, $candidate.value, 'ParameterValue', $description)
            }
        }
    } catch { }
}
