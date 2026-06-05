@echo off
set PORT=3000

cls

powershell -Command "$proc = Get-NetTCPConnection -LocalPort %PORT% -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess; if ($proc) { Stop-Process -Id $proc -Force; Write-Host 'SUCCESS: Port %PORT% terminated.' -ForegroundColor Cyan } else { Write-Host 'INFO: Port %PORT% is clear.' -ForegroundColor Green }"

echo [BUILD] Running Prettier formatter...
call npx prettier . --write

echo [BUILD] Compiling TypeScript assets...
call tsc && (
    echo [SERVER] Launching application...
    node .
) || (
    echo [ERROR] Compilation failed. Process aborted.
    exit /b 1
)