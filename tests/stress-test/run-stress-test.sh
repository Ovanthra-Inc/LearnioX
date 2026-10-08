#!/usr/bin/env bash
# ==============================================================================
# LearnioX 1,000 Concurrent Users Stress & Load Test Runner
# Validates mesh availability, executes k6 test, and parses SLA metrics.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_FILE="${SCRIPT_DIR}/stress-test-report.json"
TARGET_URL="${TARGET_URL:-http://localhost}"
WS_URL="${WS_URL:-ws://localhost}"

echo "======================================================================"
echo "🚀 LEARNIOX 1,000 VUs HIGH-CONCURRENCY STRESS & BENCHMARK SUITE"
echo "Target Endpoint : ${TARGET_URL}"
echo "WebSocket Target: ${WS_URL}"
echo "======================================================================"

# 1. Validate Docker container health
echo "[1/4] Checking Microservice mesh health..."
if command -v docker &> /dev/null; then
    RUNNING_CONTAINERS=$(docker compose ps --services --filter "status=running" 2>/dev/null || true)
    if [ -n "$RUNNING_CONTAINERS" ]; then
        echo "Active microservices detected:"
        echo "$RUNNING_CONTAINERS"
    else
        echo "⚠️ Warning: docker compose containers may not be running locally. Checking HTTP endpoint..."
    fi
fi

# Test HTTP connectivity
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${TARGET_URL}/health" 2>/dev/null || curl -s -o /dev/null -w "%{http_code}" "${TARGET_URL}/" 2>/dev/null || true)
echo "HTTP Ingress Healthcheck Response: ${HTTP_CODE}"

# 2. Check k6 availability (local binary or docker fallback)
echo "[2/4] Verifying k6 runtime..."
K6_CMD=""
if command -v k6 &> /dev/null; then
    K6_CMD="k6 run"
elif command -v docker &> /dev/null; then
    echo "k6 not found locally on PATH; utilizing dockerized grafana/k6 image..."
    K6_CMD="docker run --rm -i --network=host -v \"${SCRIPT_DIR}:/scripts\" -e BASE_URL=${TARGET_URL} -e WS_URL=${WS_URL} grafana/k6 run"
else
    echo "❌ Error: Neither k6 nor docker is installed. Please install k6 (https://k6.io/docs/get-started/installation/)."
    exit 1
fi

# 3. Execute k6 load test
echo "[3/4] Launching 1,000 Concurrent VUs Stress Test..."
echo "  - Ramp-up: 2 minutes -> 1,000 VUs"
echo "  - Plateau: 5 minutes sustained 1,000 VUs"
echo "  - Distribution: 40% Browsing, 30% Video, 20% WS Hub, 10% AI/Checkout"

if [[ "$K6_CMD" == *"docker run"* ]]; then
    $K6_CMD --summary-export=/scripts/stress-test-report.json /scripts/k6-load-test.js
else
    k6 run \
        -e BASE_URL="${TARGET_URL}" \
        -e WS_URL="${WS_URL}" \
        --summary-export="${REPORT_FILE}" \
        "${SCRIPT_DIR}/k6-load-test.js"
fi

# 4. Parse Metrics & Output Executive Summary
echo "======================================================================"
echo "📊 EXECUTIVE PERFORMANCE SUMMARY & SLA VERIFICATION"
echo "======================================================================"

if [ -f "${REPORT_FILE}" ]; then
    echo "Raw metrics persisted to: ${REPORT_FILE}"
    if command -v jq &> /dev/null; then
        P95_DUR=$(jq '.metrics.http_req_duration.values["p(95)"]' "${REPORT_FILE}" 2>/dev/null || echo "N/A")
        P99_DUR=$(jq '.metrics.http_req_duration.values["p(99)"]' "${REPORT_FILE}" 2>/dev/null || echo "N/A")
        FAIL_RATE=$(jq '.metrics.http_req_failed.values.rate' "${REPORT_FILE}" 2>/dev/null || echo "0")
        TOTAL_REQS=$(jq '.metrics.http_reqs.values.count' "${REPORT_FILE}" 2>/dev/null || echo "N/A")

        echo "----------------------------------------------------------------------"
        printf "%-30s | %-15s | %-15s\n" "Metric" "Value" "Target SLA"
        echo "----------------------------------------------------------------------"
        printf "%-30s | %-15s | %-15s\n" "Total HTTP Requests" "${TOTAL_REQS}" "N/A"
        printf "%-30s | %-15s | %-15s\n" "HTTP Latency p(95)" "${P95_DUR} ms" "< 350 ms"
        printf "%-30s | %-15s | %-15s\n" "HTTP Latency p(99)" "${P99_DUR} ms" "< 800 ms"
        printf "%-30s | %-15s | %-15s\n" "Request Failure Rate" "${FAIL_RATE}%" "< 0.5%"
        echo "----------------------------------------------------------------------"
    fi
else
    echo "k6 run finished. Review console metrics above for full SLA details."
fi

echo "✅ High-Concurrency Stress Test verification completed."
