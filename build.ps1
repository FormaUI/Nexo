<#
.SYNOPSIS
Runs the gate: the tests, the bundle, the package project's build with no warnings, and the format check; with -Full, packs both packages and verifies them as consumers receive them.

.PARAMETER Clean
Removes every build output first, so the build starts from nothing.

.PARAMETER Full
Runs the full gate: the gate, then both packages packed into artifacts/ as a release ships them, each checked against the files its list names and installed into a consumer outside the repository, by scripts/Test-Packages.ps1.

.EXAMPLE
./build.ps1 -Clean

.EXAMPLE
./build.ps1 -Full
#>
[CmdletBinding()]
param(
    [switch] $Clean,
    [switch] $Full
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$nuget = Join-Path $root 'nuget'
$solution = 'Forma.Nexo.slnx'
$tests = Join-Path $root 'tests'
$artifacts = Join-Path $root 'artifacts'

if ($Clean) {
    # The package project's bin and obj, its bundle, and the packed artifacts, which dotnet clean alone leaves behind.
    Write-Host 'Cleaning'
    Get-ChildItem $nuget -Directory -Recurse -Include 'bin', 'obj', 'wwwroot' | Remove-Item -Recurse -Force
    if (Test-Path $artifacts) {
        Remove-Item $artifacts -Recurse -Force
    }
}

foreach ($folder in $root, $tests) {
    if (-not (Test-Path (Join-Path $folder 'node_modules'))) {
        Write-Host "Restoring $(Split-Path $folder -Leaf)"
        npm ci --prefix $folder --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) {
            throw "npm ci failed for $folder."
        }
    }
}

Write-Host 'Testing'
npm test --prefix $tests
if ($LASTEXITCODE -ne 0) {
    throw 'The tests failed.'
}

# The bundle, the package and the sources all take their version from src/language/Versions.mjs.
Write-Host 'Bundling'
npm run bundle --prefix $root
if ($LASTEXITCODE -ne 0) {
    throw 'The bundle failed.'
}

# dotnet finds global.json from the working directory up, so the SDK it pins applies from the package project's folder.
Push-Location $nuget
try {
    Write-Host 'Building'
    dotnet build $solution -nologo
    if ($LASTEXITCODE -ne 0) {
        throw 'dotnet build failed.'
    }

    Write-Host 'Checking formatting'
    dotnet format $solution --verify-no-changes
    if ($LASTEXITCODE -ne 0) {
        throw 'dotnet format found changes to make; run: dotnet format Forma.Nexo.slnx from nuget/'
    }
}
finally {
    Pop-Location
}

if (-not $Full) {
    return
}

# The packages a release publishes: packed afresh, the NuGet package by a build that records its source as a release's does.
if (Test-Path $artifacts) {
    Remove-Item $artifacts -Recurse -Force
}

Push-Location $nuget
try {
    Write-Host 'Packing the NuGet package'
    dotnet pack Forma.Nexo.csproj -c Release -nologo -o $artifacts -p:ContinuousIntegrationBuild=true
    if ($LASTEXITCODE -ne 0) {
        throw 'dotnet pack failed.'
    }
}
finally {
    Pop-Location
}

Write-Host 'Packing the npm package'
npm pack $root --pack-destination $artifacts --loglevel=error
if ($LASTEXITCODE -ne 0) {
    throw 'npm pack failed.'
}

$version = [regex]::Match((Get-Content (Join-Path $root 'src' 'language' 'Versions.mjs') -Raw), "implementation = '([^']+)'").Groups[1].Value
& (Join-Path $root 'scripts' 'Test-Packages.ps1') -Directory $artifacts -Version $version
