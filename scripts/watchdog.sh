#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Online Express — API Watchdog / Auto-Repair Script
#
# Runs every 5 minutes via cron. Checks the /api/health endpoint and
# auto-repairs by restarting PM2 or rebuilding the frontend if needed.
#
# Setup (run once on VPS):
#   chmod +x /var/www/courierx/scripts/watchdog.sh
#   (crontab -l 2>/dev/null; echo "*/5 * * * * /var/www/courierx/scripts/watchdog.sh") | crontab -
#
# Logs: /var/log/courierx-watchdog.log
# ─────────────────────────────────────────────────────────────────────────────

LOG=/var/log/courierx-watchdog.log
APP_DIR=/var/www/courierx
API_URL=http://localhost:3001/api/health
MAX_LOG_LINES=500
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# ── Helpers ──────────────────────────────────────────────────────────────────
log() { echo "$TIMESTAMP [$1] $2" >> "$LOG"; }

trim_log() {
  if [ -f "$LOG" ]; then
    local lines
    lines=$(wc -l < "$LOG")
    if [ "$lines" -gt "$MAX_LOG_LINES" ]; then
      tail -n "$MAX_LOG_LINES" "$LOG" > "${LOG}.tmp" && mv "${LOG}.tmp" "$LOG"
    fi
  fi
}

# ── 1. Check API health ───────────────────────────────────────────────────────
HTTP_CODE=$(curl -s -o /tmp/courierx_health.json -w "%{http_code}" --max-time 8 "$API_URL" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
  # Parse overall status from response
  OVERALL=$(grep -o '"status":"[^"]*"' /tmp/courierx_health.json | head -1 | cut -d'"' -f4)
  if [ "$OVERALL" = "degraded" ]; then
    log "WARN" "API responded but status=degraded — restarting PM2"
    pm2 restart 0 >> "$LOG" 2>&1
  fi
  # All good — just trim log and exit
  trim_log
  exit 0
fi

# ── 2. API is DOWN — attempt restart ─────────────────────────────────────────
log "ERROR" "API DOWN (HTTP $HTTP_CODE) — attempting PM2 restart"
pm2 restart 0 >> "$LOG" 2>&1
sleep 15

# ── 3. Check again after restart ─────────────────────────────────────────────
HTTP_CODE2=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$API_URL" 2>/dev/null)

if [ "$HTTP_CODE2" = "200" ]; then
  log "OK" "Repair successful after PM2 restart (HTTP $HTTP_CODE2)"
  trim_log
  exit 0
fi

# ── 4. Still down — attempt full rebuild ─────────────────────────────────────
log "ERROR" "Still down after restart (HTTP $HTTP_CODE2) — attempting full rebuild"

cd "$APP_DIR" || { log "ERROR" "Cannot cd to $APP_DIR"; exit 1; }

git pull >> "$LOG" 2>&1
npm install --prefix "$APP_DIR/api" >> "$LOG" 2>&1
npm run build >> "$LOG" 2>&1
pm2 restart 0 >> "$LOG" 2>&1
sleep 20

# ── 5. Final check ────────────────────────────────────────────────────────────
HTTP_CODE3=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$API_URL" 2>/dev/null)

if [ "$HTTP_CODE3" = "200" ]; then
  log "OK" "Full rebuild repair successful (HTTP $HTTP_CODE3)"
else
  log "CRITICAL" "All repair attempts failed (HTTP $HTTP_CODE3) — manual intervention required"
fi

trim_log
