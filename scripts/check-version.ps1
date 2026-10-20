$GITHUB_USER = "Gb65079"
$GITHUB_REPO = "cardapio-cora"
$BRANCH = "prototype"

Write-Host "[INFO] Checking local version from package.json..." -ForegroundColor Cyan

if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] The package.json file was not found in this folder!" -ForegroundColor Red
    Read-Host -Prompt "Press Enter to exit"
    exit
}

$json = Get-Content "package.json" | ConvertFrom-Json
$versaoLocal = "v" + $json.version.TrimStart("v")

Write-Host "[INFO] Repository: $GITHUB_USER/$GITHUB_REPO"
Write-Host "[INFO] Local Version: $versaoLocal`n"

Write-Host "[INFO] Checking remote version on GitHub..." -ForegroundColor Cyan
try {
    $url = "https://api.github.com/repos/$GITHUB_USER/$GITHUB_REPO/releases/latest"
    $response = Invoke-RestMethod -Uri $url -Headers @{ "User-Agent" = "PowerShellScript" }
    $versaoRemota = $response.tag_name

    Write-Host "[INFO] Remote Version: $versaoRemota`n"

    if ($versaoLocal -ne$versaoRemota) {
        Write-Host "[WARNING] A new version is available on GitHub ($versaoRemota)!" -ForegroundColor Yellow
        
        $resposta = Read-Host -Prompt "Press Y to Yes or N to No to update"
        
        if ($resposta -eq "Y" -or $resposta -eq "y") {
            Write-Host "`n[INFO] Downloading zip from branch $BRANCH..." -ForegroundColor Cyan
            $zipUrl = "https://github.com/$GITHUB_USER/$GITHUB_REPO/archive/refs/heads/$BRANCH.zip"
            $zipPath = "$env:TEMP\repo_update.zip"
            $extractPath = "$env:TEMP\repo_extracted"

            Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath

            if (Test-Path $extractPath) { Remove-Item -Recurse -Force $extractPath }

            Write-Host "[INFO] Unpacking zip file..." -ForegroundColor Cyan
            Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

            $sourceDir = Get-ChildItem $extractPath | Select-Object -ExpandProperty FullName

            Write-Host "`n[INFO] Download and extraction complete." -ForegroundColor Green
            $overwrite = Read-Host -Prompt "Do you want to overwrite modified files with the new version? (Press Y to Yes or N to No)"

            if ($overwrite -eq "Y" -or $overwrite -eq "y") {
                Write-Host "[INFO] Overwriting files..." -ForegroundColor Cyan
                Get-ChildItem -Path $sourceDir -Recurse \vert{} ForEach-Object {$target = $_.FullName.Replace($sourceDir, (Get-Location).Path)
                    if ($_.PsIsContainer) {
                        if (-not (Test-Path $target)) { New-Item -ItemType Directory -Path$target | Out-Null }
                    } else {
                        Copy-Item $_.FullName -Destination$target -Force
                    }
                }
                Write-Host "[SUCCESS] Files updated successfully!" -ForegroundColor Green
            } else {
                Write-Host "[INFO] File overwrite skipped." -ForegroundColor Gray
            }

            Remove-Item -Force $zipPath
            Remove-Item -Recurse -Force $extractPath
        } else {
            Write-Host "[INFO] Update skipped. Starting current version..." -ForegroundColor Gray
        }
    } else {
        Write-Host "[SUCCESS] Your project is already at the latest version!" -ForegroundColor Green
    }
} catch {
    Write-Host "`n[NOTICE] No official Release found on GitHub (or connection error)." -ForegroundColor Yellow
    Write-Host "Make sure you have created a Release pointing to a Tag on GitHub." -ForegroundColor Yellow
}

Write-Host ""