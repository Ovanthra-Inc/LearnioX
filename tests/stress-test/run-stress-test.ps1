# ==============================================================================
# LearnioX 1,000 Concurrent Users Stress & Load Test Runner (PowerShell)
# ==============================================================================

param(
    [string]$TargetUrl = "http://localhost",
    [string]$WsUrl = "ws://localhost"
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ReportFile = Join-Path $ScriptDir "stress-test-report.json"
$TestScript = Join-Path $ScriptDir "k6-load-test.js"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "🚀 LEARNIOX 1,000 VUs HIGH-CONCURRENCY STRESS & BENCHMARK SUITE" -ForegroundColor Green
Write-Host "Target Endpoint : $TargetUrl"
Write-Host "WebSocket Target: $WsUrl"
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Healthcheck
Write-Host "[1/4] Checking Microservice mesh health..." -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "$TargetUrl/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "HTTP Ingress Healthcheck Response: $($resp.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Warning: $TargetUrl/health returned unreachable or error: $_" -ForegroundColor DarkYellow
}

# 2. Check k6 availability
Write-Host "[2/4] Verifying k6 runtime..." -ForegroundColor Yellow
$k6Cmd = Get-Command k6 -ErrorAction SilentlyContinue
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue

if ($k6Cmd) {
    Write-Host "Using local k6 installation: $($k6Cmd.Source)" -ForegroundColor Green
    & k6 run -e BASE_URL="$TargetUrl" -e WS_URL="$WsUrl" --summary-export="$ReportFile" "$TestScript"
} elseif ($dockerCmd) {
    Write-Host "k6 not found on PATH; utilizing dockerized grafana/k6 image..." -ForegroundColor Green
    docker run --rm -i --network=host -v "${ScriptDir}:/scripts" -e BASE_URL="$TargetUrl" -e WS_URL="$WsUrl" grafana/k6 run --summary-export=/scripts/stress-test-report.json /scripts/k6-load-test.js
} else {
    Write-Error "Neither k6 nor Docker was found on the system. Please install k6: winget install k6"
    exit 1
}

# 3. Output Summary Table
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "📊 EXECUTIVE PERFORMANCE SUMMARY & SLA VERIFICATION" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan

if (Test-Path $ReportFile) {
    $reportJson = Get-Content $ReportFile -Raw | ConvertFrom-Json
    $p95 = $reportJson.metrics.http_req_duration.values.'p(95)'
    $p99 = $reportJson.metrics.http_req_duration.values.'p(99)'
    $failRate = $reportJson.metrics.http_req_failed.values.rate
    $totalReqs = $reportJson.metrics.http_reqs.values.count

    Write-Host "----------------------------------------------------------------------"
    "{0,-30} | {1,-15} | {2,-15}" -f "Metric", "Value", "Target SLA"
    Write-Host "----------------------------------------------------------------------"
    "{0,-30} | {1,-15} | {2,-15}" -f "Total HTTP Requests", "$totalReqs", "N/A"
    "{0,-30} | {1,-15} | {2,-15}" -f "HTTP Latency p(95)", "$([math]::Round($p95, 2)) ms", "< 350 ms"
    "{0,-30} | {1,-15} | {2,-15}" -f "HTTP Latency p(99)", "$([math]::Round($p99, 2)) ms", "< 800 ms"
    "{0,-30} | {1,-15} | {2,-15}" -f "Request Failure Rate", "$([math]::Round($failRate * 100, 3))%", "< 0.5%"
    Write-Host "----------------------------------------------------------------------"
} else {
    Write-Host "k6 execution finished. Report file not generated." -ForegroundColor Yellow
}

Write-Host "✅ High-concurrency stress test complete." -ForegroundColor Green
