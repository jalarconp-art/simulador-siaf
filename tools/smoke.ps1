# Prueba de humo: ejecuta la app compilada con un guion en la interfaz, captura la ventana y la cierra.
param([string]$Nombre, [string]$Guion = "", [string]$Db = "")
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
$raiz = Split-Path $PSScriptRoot -Parent
$out = Join-Path $raiz "tools\smoke-out"
New-Item -ItemType Directory -Force $out | Out-Null
if ($Db -eq "") { $Db = Join-Path $out "smoke.sqlite" }
$env:SIAF_DB = $Db
$env:SIAF_SMOKE = Join-Path $out "$Nombre.png"
$env:SIAF_SMOKE_JS = $Guion
$p = Start-Process (Join-Path $raiz "node_modules\electron\dist\electron.exe") -ArgumentList "`"$raiz`"" -PassThru
$null = $p.WaitForExit(120000)
Remove-Item Env:SIAF_SMOKE, Env:SIAF_SMOKE_JS, Env:SIAF_DB -ErrorAction SilentlyContinue
"exit=$($p.ExitCode)"
Get-Content (Join-Path $out "$Nombre.png.txt") -ErrorAction SilentlyContinue | Select-Object -First 25
