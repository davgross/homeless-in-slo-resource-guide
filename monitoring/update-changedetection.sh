#!/usr/bin/env bash
# update-changedetection.sh
# Pull the latest changedetection.io (and sockpuppetbrowser) images and
# restart the stack only if something actually changed.
#
# Order matters:
#   1. pull, and bail out early if nothing is new
#   2. export the config while the container is still UP, so extract-config.py
#      uses the live API
#   3. stop the stack, which flushes in-memory state to the <uuid>/watch.json
#      files, then take a verified backup of the quiesced datastore
#   4. start the new images; datastore migrations run on first boot and are
#      one-way, which is why the backup happens before this point

set -euo pipefail

COMPOSE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE="docker compose -f $COMPOSE_DIR/docker-compose.yml"

echo "=== ChangeDetection.io updater ==="
echo "Working directory: $COMPOSE_DIR"
echo

running_version() {
    curl -s --max-time 5 http://localhost:5000/ 2>/dev/null \
        | grep -oE '0\.[0-9]+\.[0-9]+' | head -1 || true
}

before_version=$(running_version)
[[ -n "$before_version" ]] && echo "Currently running: $before_version"

# Record image digests before the pull
before_cd=$(docker image inspect ghcr.io/dgtlmoon/changedetection.io:latest \
    --format '{{.Id}}' 2>/dev/null || echo "none")
before_sp=$(docker image inspect dgtlmoon/sockpuppetbrowser:latest \
    --format '{{.Id}}' 2>/dev/null || echo "none")

echo "Pulling latest images..."
$COMPOSE pull

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

# Export config FIRST, while the container is still up and the API answers.
echo
echo "Extracting config snapshot (live API)..."
python3 "$COMPOSE_DIR/extract-config.py"

echo
echo "Stopping stack cleanly (to flush state to disk)..."
$COMPOSE stop

echo
echo "Backing up the datastore before migrations run..."
"$COMPOSE_DIR/backup-monitoring.sh"

echo
echo "Starting updated stack..."
$COMPOSE up -d --remove-orphans

echo
echo "Waiting for the app to come up..."
for _ in $(seq 1 30); do
    after_version=$(running_version)
    [[ -n "$after_version" ]] && break
    sleep 2
done

echo
if [[ -n "${after_version:-}" ]]; then
    echo "Now running: ${before_version:-unknown} -> $after_version"
else
    echo "Warning: the app did not answer on http://localhost:5000/ within 60s." >&2
    echo "Check the logs: docker logs changedetection" >&2
fi

echo
echo "Running containers:"
$COMPOSE ps

echo
echo "Review and commit the refreshed config if it changed:"
echo "  git -C $COMPOSE_DIR diff --stat changedetection-config.json"
