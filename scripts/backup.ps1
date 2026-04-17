#!/usr/bin/env pwsh
# Database Backup Script for Platform Adv

$BackupDir = "backups"
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$OutputFile = "$BackupDir/backup_$Timestamp.sql"

# Try to get connection string from .env if available
$EnvFile = "backend/.env"
$ConnectionString = ""

if (Test-Path $EnvFile) {
    $Content = Get-Content $EnvFile
    foreach ($Line in $Content) {
        if ($Line -like "DIRECT_URL=*") {
            $ConnectionString = $Line.Split('=', 2)[1].Trim('"')
            break
        }
        elseif ($Line -like "DATABASE_URL=*" -and $ConnectionString -eq "") {
            $ConnectionString = $Line.Split('=', 2)[1].Trim('"')
        }
    }
}

if ($ConnectionString -eq "") {
    Write-Error "Could not find DATABASE_URL or DIRECT_URL in backend/.env"
    exit 1
}

Write-Host "Iniciando backup para $OutputFile..." -ForegroundColor Cyan

# Use prisma to dump schema + data if possible, or just advice for pg_dump
# Since we don't have pg_dump guaranteed in PATH, we can use a small node script or just raw prisma

# Recommendation: In production (Vercel/Supabase), use the Supabase Dashboard export or a GitHub Action with pg_dump.
# For local dev, we will use 'npx prisma db pull' as a schema backup, but for DATA we need pg_dump.

Write-Host "DICA: Para backup completo de DADOS no Supabase, use o comando:" -ForegroundColor Yellow
Write-Host "pg_dump -h db.ngsuvpqxyrnpatuquppl.supabase.co -U postgres -d postgres > $OutputFile" -ForegroundColor White

# Create a JSON backup of main tables using Prisma
Write-Host "Gerando backup de dados em formato JSON..." -ForegroundColor Cyan
cd backend
npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
  const data = {};
  const tables = ['User', 'Client', 'Process', 'FinancialRecord'];
  for (const table of tables) {
    data[table] = await prisma[table.charAt(0).toLowerCase() + table.slice(1)].findMany();
  }
  fs.writeFileSync('../$BackupDir/data_backup_$Timestamp.json', JSON.stringify(data, null, 2));
  console.log('Backup JSON concluído.');
  await prisma.\$disconnect();
}
run();
"
cd ..

Write-Host "Backup finalizado com sucesso em $BackupDir/" -ForegroundColor Green
