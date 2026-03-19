#!/usr/bin/env bash
# update-changedetection.sh
# Pull the latest changedetection.io (and sockpuppetbrowser) images and
# restart the stack only if something actually changed.
#
# Uses `docker compose stop` before restarting so changedetection.io can
# flush its in-memory state to url-watches.json before the container exits.

set -euo pipefail

COMPOSE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== ChangeDetection.io updater ==="
echo "Working directory: $COMPOSE_DIR"
echo

# Record image digests before the pull
before_cd=$(docker image inspect ghcr.io/dgtlmoon/changedetection.io:latest \
    --format '{{.Id}}' 2>/dev/null || echo "none")
before_sp=$(docker image inspect dgtlmoon/sockpuppetbrowser:latest \
    --format '{{.Id}}' 2>/dev/null || echo "none")

echo "Pulling latest images..."
docker compose -f "$COMPOSE_DIR/docker-compose.yml" pull

# Record image digests after the pull
after_cd=$(docker image inspect ghcr.io/dgtlmoon/changedetection.io:latest \
    --format '{{.Id}}' 2>/dev/null || echo "none")
after_sp=$(docker image inspect dgtlmoon/sockpuppetbrowser:latest \
    --format '{{.Id}}' 2>/dev/null || echo "none")

if [[ "$before_cd" == "$after_cd" && "$before_sp" == "$after_sp" ]]; then
    echo
    echo "Already up to date — no restart needed."
    exit 0
fi

echo
echo "New image(s) detected:"
[[ "$before_cd" != "$after_cd" ]] && echo "  changedetection.io: ${before_cd:0:19}... -> ${after_cd:0:19}..."
[[ "$before_sp" != "$after_sp" ]] && echo "  sockpuppetbrowser:  ${before_sp:0:19}... -> ${after_sp:0:19}..."

echo
echo "Stopping stack cleanly (to flush state to disk)..."
docker compose -f "$COMPOSE_DIR/docker-compose.yml" stop

echo
echo "Extracting config snapshot..."
python3 "$COMPOSE_DIR/extract-config.py"

echo
echo "Starting updated stack..."
docker compose -f "$COMPOSE_DIR/docker-compose.yml" up -d --remove-orphans

echo
echo "Done. Running containers:"
docker compose -f "$COMPOSE_DIR/docker-compose.yml" ps
