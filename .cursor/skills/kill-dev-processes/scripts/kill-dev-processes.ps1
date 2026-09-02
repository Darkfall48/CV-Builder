# Kill leftover Vite listeners on 5173-5180 and 4173-4180 (and optional extras).
# Docker is reported only, unless -KillDocker is set (after the user confirmed).

param(
    [int[]]$Ports,
    [switch]$KillDocker
)

$ErrorActionPreference = "Continue"

if (-not $Ports) {
    $Ports = @(4173..4180) + @(5173..5180)
}

function Get-Listeners {
    param([int]$Port)
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
}

function Test-DockerProcess {
    param($Proc)
    if (-not $Proc) { return $false }
    $name = $Proc.ProcessName
    if ($name -match '(?i)docker|com\.docker|vpnkit') { return $true }
    try {
        if ($Proc.Path -and ($Proc.Path -match '(?i)[\\/]Docker[\\/]')) { return $true }
    }
    catch { }
    return $false
}

$killed = 0
$dockerHits = 0

foreach ($port in $Ports) {
    $conns = Get-Listeners -Port $port
    if (-not $conns) { continue }

    $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $pids) {
        if ($procId -in @(0, 4)) {
            Write-Host "Port $port : skip PID $procId (system)"
            continue
        }

        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        $name = if ($proc) { $proc.ProcessName } else { "unknown" }

        if (Test-DockerProcess $proc) {
            $dockerHits++
            if (-not $KillDocker) {
                Write-Host "Port $port : Docker is using this port (PID $procId, $name) — not killed (ask the user first)"
                continue
            }
        }

        try {
            Stop-Process -Id $procId -Force -ErrorAction Stop
            $killed++
            Write-Host "Port $port : killed PID $procId ($name)"
        }
        catch {
            Write-Host "Port $port : failed to kill PID $procId ($name) — $($_.Exception.Message)"
        }
    }
}

if ($killed -eq 0 -and $dockerHits -eq 0) {
    Write-Host "No leftover Vite listeners on 4173-4180 or 5173-5180."
}
else {
    Write-Host "Killed $killed process(es). Docker ports reported: $dockerHits."
}
