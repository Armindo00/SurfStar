# SurfStar — ligação ao Supabase (correr na pasta do projeto)
# Uso: .\scripts\setup-cloud.ps1 -AnonKey "eyJ..."

param(
  [Parameter(Mandatory = $true)]
  [string]$AnonKey
)

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"

@"
VITE_SUPABASE_URL=https://msozgsmqytnejijyzoot.supabase.co
VITE_SUPABASE_ANON_KEY=$AnonKey
"@ | Set-Content -Path $envFile -Encoding UTF8

Write-Host "OK: .env criado em $envFile"
Write-Host ""
Write-Host "Ainda falta no Supabase (dashboard, 2 min):"
Write-Host "  1. Authentication -> Email -> desligar Confirm email"
Write-Host "  2. SQL Editor -> colar supabase/schema.sql -> Run"
Write-Host ""
Write-Host "Depois: npm run dev"
