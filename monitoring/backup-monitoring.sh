#!/usr/bin/env bash
# Backup changedetection.io data.
#
# The container writes <uuid>/watch.json as root with mode 0600, so a tar run
# as the host user silently skips every watch config.  The archive is created
# from inside a throwaway root container instead, then verified by counting
# the watch.json members before any old backup is rotated away.

set -euo pipefail

MONITOR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$HOME/changedetection-backups"
IMAGE="ghcr.io/dgtlmoon/changedetection.io:latest"
DATE=$(date +%Y-%m-%d-%H%M)
BACKUP_NAME="changedetection-backup-$DATE.tar.gz"
KEEP=5

mkdir -p "$BACKUP_DIR"

# How many watches should the archive contain?
expected=$(docker run --rm --entrypoint sh \
    -v "$MONITOR_DIR/changedetection-data":/d:ro "$IMAGE" \
    -c 'ls -d /d/*/watch.json 2>/dev/null | wc -l')

if [[ "$expected" -eq 0 ]]; then
    echo "Error: no watch.json files found in $MONITOR_DIR/changedetection-data" >&2
    echo "Refusing to create a backup that would contain no watch configuration." >&2
    exit 1
fi

echo "Backing up $expected watches to $BACKUP_DIR/$BACKUP_NAME"

docker run --rm \
    -v "$MONITOR_DIR":/data:ro \
    -v "$BACKUP_DIR":/backup \
    --entrypoint tar "$IMAGE" \
    -czf "/backup/$BACKUP_NAME" -C /data changedetection-data

# Verify the archive really contains every watch before trusting it.
actual=$(docker run --rm -v "$BACKUP_DIR":/backup:ro --entrypoint sh "$IMAGE" \
    -c "tar -tzf '/backup/$BACKUP_NAME' | grep -c 'watch\.json$'")

if [[ "$actual" -ne "$expected" ]]; then
    echo "Error: archive holds $actual watch.json files, expected $expected." >&2
    echo "Keeping the bad archive for inspection: $BACKUP_DIR/$BACKUP_NAME" >&2
    exit 1
fi

size=$(du -h "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)
echo "Backup complete and verified: $actual watches, $size"
echo "Location: $BACKUP_DIR/$BACKUP_NAME"

# Rotate only now that a good backup exists.
cd "$BACKUP_DIR"
removed=$(ls -t changedetection-backup-*.tar.gz 2>/dev/null | tail -n +$((KEEP + 1)) || true)
if [[ -n "$removed" ]]; then
    echo "$removed" | xargs -r rm --
    echo "Rotated out $(echo "$removed" | wc -l) old backup(s), kept newest $KEEP."
fi
