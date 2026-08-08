#!/usr/bin/env bash
#
# sockpuppet-watchdog.sh — recover a stalled changedetection.io monitoring stack.
#
# It watches for two independent failure modes. Both end with watches silently
# not being checked, and neither recovers on its own.
#
# A. Wedged browser pool.
#    sockpuppetbrowser has no per-session timeout. A browser slot is released
#    only when the client websocket closes, so a client that dies without
#    closing cleanly holds its slot forever. Once every slot is leaked,
#    sockpuppetbrowser answers new connections with an immediate close, which
#    changedetection.io reports as:
#      BrowserType.connect_over_cdp: Target page, context or browser has been closed
#
# B. Deadlocked worker pool.
#    A browser-backed watch can hang inside Playwright past any configured
#    timeout (PDF-ish URLs and some SPAs are repeat offenders). The worker that
#    claimed it never finishes, and never picks up another job. Once every
#    worker is stuck, the whole queue stops draining — including plain-HTTP
#    watches that never touch the browser at all. This is the more damaging
#    mode, and it can happen while the browser pool still looks healthy: only
#    some slots leak, so a pure capacity check reports everything is fine.
#
# `restart: unless-stopped` helps with neither, because nothing ever crashes.
#
# Distinguishing stuck from busy:
#   A busy pool keeps retiring connections, so connection_count_total climbs.
#   A busy queue keeps shrinking as work completes. Each check therefore needs
#   its symptom to persist across several consecutive polls before acting, so
#   a merely loaded system is never restarted mid-work.
#
# Install: see sockpuppet-watchdog.README.md in this directory.

set -uo pipefail

SP_CONTAINER="${SOCKPUPPET_CONTAINER:-monitoring-sockpuppetbrowser-1}"
CD_CONTAINER="${CHANGEDETECTION_CONTAINER:-changedetection}"
STATS_URL="${SOCKPUPPET_STATS_URL:-http://127.0.0.1:8080/stats}"
CD_URL="${CHANGEDETECTION_URL:-http://localhost:5000}"
DATASTORE="${CHANGEDETECTION_DATASTORE:-/home/dgross/ResourceGuide/monitoring/changedetection-data/url-watches.json}"
POOL_STRIKES_NEEDED="${SOCKPUPPET_STRIKES:-2}"      # x5min: pool wedged
QUEUE_STRIKES_NEEDED="${QUEUE_STRIKES:-3}"          # x5min: queue not draining
STALL_MINUTES="${STALL_MINUTES:-20}"                # no watch checked in this long = stalled
STATE_FILE="${XDG_CACHE_HOME:-$HOME/.cache}/sockpuppet-watchdog.state.json"

log() { printf '%s\n' "$*"; }   # stdout is captured by the systemd journal

mkdir -p "$(dirname "$STATE_FILE")"
[ -s "$STATE_FILE" ] || printf '{}' > "$STATE_FILE"
state=$(cat "$STATE_FILE" 2>/dev/null); [ -n "$state" ] || state='{}'
getstate() { jq -r --arg k "$1" --arg d "$2" '.[$k] // $d' <<<"$state"; }

pool_strikes=$(getstate pool_strikes 0)
pool_total=$(getstate pool_total -1)
queue_strikes=$(getstate queue_strikes 0)
queue_size_prev=$(getstate queue_size -1)

save_state() {
    jq -n --argjson ps "${1:-0}" --argjson pt "${2:--1}" \
          --argjson qs "${3:-0}" --argjson qz "${4:--1}" \
      '{pool_strikes:$ps, pool_total:$pt, queue_strikes:$qs, queue_size:$qz}' > "$STATE_FILE"
}

running() { [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" = "true" ]; }

# ---------------------------------------------------------------------------
# Check A: is the browser pool wedged?
# ---------------------------------------------------------------------------
if running "$SP_CONTAINER"; then
    # Read capacity from the container so this cannot drift out of step with
    # docker-compose.yml.
    max=$(docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$SP_CONTAINER" 2>/dev/null \
            | sed -n 's/^MAX_CONCURRENT_CHROME_PROCESSES=//p' | head -1)
    [ -n "${max:-}" ] || max=10   # sockpuppetbrowser's own default

    if stats=$(curl -fsS --max-time 10 "$STATS_URL" 2>/dev/null); then
        active=$(jq -r '.active_connections // empty' <<<"$stats")
        total=$(jq -r '.connection_count_total // empty' <<<"$stats")
        if [ -n "$active" ] && [ -n "$total" ]; then
            if [ "$active" -ge "$max" ] && [ "$total" = "$pool_total" ]; then
                pool_strikes=$((pool_strikes + 1))
                log "pool at capacity ($active/$max), no progress since last check (total=$total) — strike $pool_strikes/$POOL_STRIKES_NEEDED"
            else
                pool_strikes=0
            fi
            pool_total="$total"

            if [ "$pool_strikes" -ge "$POOL_STRIKES_NEEDED" ]; then
                log "browser pool wedged at $active/$max, connection_count_total frozen at $total — restarting $SP_CONTAINER"
                docker restart "$SP_CONTAINER" >/dev/null 2>&1 \
                    && log "restarted $SP_CONTAINER" || log "WARNING: failed to restart $SP_CONTAINER"
                pool_strikes=0
                pool_total=-1
            fi
        fi
    fi
fi

# ---------------------------------------------------------------------------
# Check B: is the queue draining?
#
# A leaked-but-not-full browser pool still deadlocks every worker, so this must
# not be gated on Check A having fired.
# ---------------------------------------------------------------------------
if running "$CD_CONTAINER" && [ -r "$DATASTORE" ]; then
    token=$(jq -r '.settings.application.api_access_token // empty' "$DATASTORE" 2>/dev/null)

    if [ -n "$token" ] && info=$(curl -fsS --max-time 15 "$CD_URL/api/v1/systeminfo" -H "x-api-key: $token" 2>/dev/null); then
        queue_size=$(jq -r '.queue_size // empty' <<<"$info")

        if [ -n "$queue_size" ]; then
            # A draining queue shrinks. Only a queue that is non-empty AND never
            # shrinking is a candidate for being stalled.
            if [ "$queue_size" -gt 0 ] && [ "$queue_size_prev" -ge 0 ] && [ "$queue_size" -ge "$queue_size_prev" ]; then
                queue_strikes=$((queue_strikes + 1))
                log "queue not draining ($queue_size_prev -> $queue_size) — strike $queue_strikes/$QUEUE_STRIKES_NEEDED"
            else
                queue_strikes=0
            fi
            queue_size_prev="$queue_size"

            if [ "$queue_strikes" -ge "$QUEUE_STRIKES_NEEDED" ]; then
                # Confirm with the decisive signal before acting: if no watch at
                # all has been checked recently, the workers really are stuck.
                # floor: last_checked is a float, and bash compares integers only
                newest=$(curl -fsS --max-time 30 "$CD_URL/api/v1/watch" -H "x-api-key: $token" 2>/dev/null \
                           | jq -r '([.[].last_checked // 0] | max // 0) | floor')
                now=$(date +%s)
                if [ -n "$newest" ] && [ "$newest" -gt 0 ]; then
                    idle_min=$(( (now - newest) / 60 ))
                    if [ "$idle_min" -ge "$STALL_MINUTES" ]; then
                        log "workers deadlocked: queue=$queue_size, no watch checked in ${idle_min}m — restarting $CD_CONTAINER and $SP_CONTAINER"
                        # Restart the browser first so changedetection comes up
                        # against a clean pool.
                        running "$SP_CONTAINER" && docker restart "$SP_CONTAINER" >/dev/null 2>&1
                        docker restart "$CD_CONTAINER" >/dev/null 2>&1 \
                            && log "restarted $CD_CONTAINER" || log "WARNING: failed to restart $CD_CONTAINER"
                        pool_strikes=0; pool_total=-1
                        queue_strikes=0; queue_size_prev=-1
                    else
                        log "queue static but a watch was checked ${idle_min}m ago — treating as busy, not stalled"
                        queue_strikes=0
                    fi
                fi
            fi
        fi
    fi
fi

save_state "$pool_strikes" "$pool_total" "$queue_strikes" "$queue_size_prev"
