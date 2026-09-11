# Windows build script for ANONYMIKECONNECT
# Used by .github/workflows/release.yml; can also be run locally on Windows:
#   powershell -ExecutionPolicy Bypass -File .github/scripts/windows-build.ps1
#   powershell ... -SkipBuild   (only recompute release.json from an existing dist exe)

[CmdletBinding()]
param(
    [string]$Version = "ANONYMIKECONNECTV1.0",
    [string]$PortalDir = "release-portal",
    [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$exePath = Join-Path (Join-Path $repoRoot 'dist') "$Version.exe"
$metaPath = Join-Path (Join-Path $repoRoot $PortalDir) 'release.json'

Write-Host "Repo root: $repoRoot"
Write-Host "Version:   $Version"

if (-not $SkipBuild) {
    Push-Location $repoRoot
    try {
        python -m pip install --upgrade pip
        pip install -r anonymikeconnect/requirements.txt
        pip install pyinstaller

        foreach ($dir in @('dist', 'build')) {
            $p = Join-Path $repoRoot $dir
            if (Test-Path $p) { Remove-Item -Recurse -Force $p }
        }
        $spec = Join-Path $repoRoot "$Version.spec"
        if (Test-Path $spec) { Remove-Item -Force $spec }

        $entry = "anonymikeconnect/run_anonymikeconnect.py"
        Write-Host "Using entrypoint: $entry"
        pyinstaller --onefile --clean --noconfirm --name $Version $entry

        if (-not (Test-Path $exePath)) {
            throw "Build failed: $exePath not found"
        }
    } finally {
        Pop-Location
    }
}

if (-not (Test-Path $exePath)) {
    throw "Installer not found at $exePath. Build first (omit -SkipBuild) or check the version name."
}

# Compute SHA256 and size
$hash = Get-FileHash -Algorithm SHA256 $exePath
$sha256 = $hash.Hash.ToLowerInvariant()
$size = (Get-Item $exePath).Length

Write-Host "Built:  $exePath"
Write-Host "SHA256: $sha256"
Write-Host "Size:   $size"

# NOTE: no GUI smoke test here — ANONYMIKECONNECT is a windowed Tkinter app,
# and launching it on a headless CI runner just blocks until timeout.

# Write release metadata into the portal folder (the file the web page fetches)
$releaseMeta = [ordered]@{
    version = $Version
    file    = "$Version.exe"
    url     = ""
    sha256  = $sha256
    size    = $size
    notes   = "Windows build published by CI ($Version)."
}
$releaseMeta | ConvertTo-Json | Set-Content -Encoding UTF8 $metaPath

Write-Host "Wrote $metaPath"
Write-Host (Get-Content $metaPath -Raw)
