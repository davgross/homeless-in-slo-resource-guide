#!/usr/bin/env bash
#
# sockpuppet-watchdog.sh — recover a wedged sockpuppetbrowser browser pool.
#
# Why this exists:
#   sockpuppetbrowser has no per-session timeout. A browser slot is released only
#   when the client websocket closes. If a Playwright client dies without closing
#   cleanly (container restart, host power-off mid-fetch, half-open socket), the
#   slot is held forever. Once every slot is leaked, sockpuppetbrowser answers new
#   connections with an immediate close, which changedetection.io reports as:
#
#     BrowserType.connect_over_cdp: Target page, context or browser has been closed
#
#   `restart: unless-stopped` does not help, because the process never crashes.
#
# How it decides the pool is wedged rather than merely busy:
#   A busy pool still retires connections, so connection_count_total climbs. A
#   wedged pool sits at full capacity with connection_count_total frozen. This
#   script requires BOTH conditions to hold for $STRIKES_NEEDED consecutive runs
#   before restarting, so a genuinely saturated pool is never killed mid-work.
#
# Install: see sockpuppet-watchdog.README.md in this directory.

set -uo pipefail

CONTAINER="${SOCKPUPPET_CONTAINER:-monitoring-sockpuppetbrowser-1}"
STATS_URL="${SOCKPUPPET_STATS_URL:-http://127.0.0.1:8080/stats}"
STRIKES_NEEDED="${SOCKPUPPET_STRIKES:-2}"
STATE_FILE="${XDG_CACHE_HOME:-$HOME/.cache}/sockpuppet-watchdog.state"

log() { printf '%s\n' "$*"; }          # stdout is captured by the systemd journal
die() { log "$*"; exit 0; }            # never fail the unit; a hiccup is not an emergency

mkdir -p "$(dirname "$STATE_FILE")"

# Nothing to police if the container is not running.
running=$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null) || die "container $CONTAINER not found"
[ "$running" = "true" ] || die "container $CONTAINER is not running"

# Read the real capacity from the container rather than hardcoding it here, so
# this cannot silently drift out of step with docker-compose.yml.
max=$(docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$CONTAINER" 2>/dev/null \
        | sed -n 's/^MAX_CONCURRENT_CHROME_PROCESSES=//p' | head -1)
[ -n "${max:-}" ] || max=10   # sockpuppetbrowser's own default

stats=$(curl -fsS --max-time 10 "$STATS_URL" 2>/dev/null) || die "stats endpoint unreachable at $STATS_URL"
active=$(jq -r '.active_connections // empty' <<<"$stats")
total=$(jq -r '.connection_count_total // empty' <<<"$stats")
[ -n "$active" ] && [ -n "$total" ] || die "unexpected stats payload: $stats"

prev_strikes=0
prev_total=-1
if [ -r "$STATE_FILE" ]; then
    read -r prev_strikes prev_total < "$STATE_FILE" 2>/dev/null || true
    : "${prev_strikes:=0}" "${prev_total:=-1}"
fi

if [ "$active" -ge "$max" ] && [ "$total" = "$prev_total" ]; then
    strikes=$((prev_strikes + 1))
    log "at capacity ($active/$max) with no progress since last check (total=$total) — strike $strikes/$STRIKES_NEEDED"
else
    strikes=0
fi

if [ "$strikes" -ge "$STRIKES_NEEDED" ]; then
    log "pool wedged at $active/$max, connection_count_total frozen at $total — restarting $CONTAINER"
    if docker restart "$CONTAINER" >/dev/null 2>&1; then
        log "restarted $CONTAINER"
    else
        log "WARNING: failed to restart $CONTAINER"
    fi
    strikes=0
    total=-1   # force a fresh baseline after the restart
fi

printf '%s %s\n' "$strikes" "$total" > "$STATE_FILE"
