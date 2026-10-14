# Corre todas las pruebas del backend y guarda los resultados en TestResults\
#   tests-<fecha>.log  -> salida de consola completa
#   tests_*.trx        -> detalle por prueba (XML)
# Uso (desde cualquier carpeta):  .\gastos-app\api\run-tests.ps1

# Continue: con "Stop", PowerShell 5.1 corta el script si dotnet escribe en stderr.
$ErrorActionPreference = "Continue"

# Si la API está corriendo, sus DLL quedan bloqueadas y las pruebas de integración no compilan (MSB3021).
$api = Get-Process -Name "Gastos.Api" -ErrorAction SilentlyContinue
if ($api) {
    Write-Host "Gastos.Api está corriendo (PID $($api.Id -join ', ')). Detenela (Shift+F5 en VS o Stop-Process -Id <PID>) y volvé a correr el script." -ForegroundColor Yellow
    exit 1
}

Push-Location $PSScriptRoot
try {
    $ts = Get-Date -Format "yyyyMMdd-HHmmss"
    New-Item -ItemType Directory -Force TestResults | Out-Null
    $log = "TestResults\tests-$ts.log"

    dotnet test --logger "trx;LogFilePrefix=tests" --results-directory TestResults 2>&1 | Tee-Object $log
    $code = $LASTEXITCODE

    Write-Host ""
    Write-Host "Log guardado en: $PSScriptRoot\$log" -ForegroundColor Cyan
    exit $code
}
finally {
    Pop-Location
}
