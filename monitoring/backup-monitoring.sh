#!/bin/bash
# Backup Changedetection.io data

BACKUP_DIR="$HOME/changedetection-backups"
DATE=$(date +%Y-%m-%d)
BACKUP_FILE="$BACKUP_DIR/changedetection-backup-$DATE.tar.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Creating backup: $BACKUP_FILE"
tar -czf "$BACKUP_FILE" changedetection-data/

echo "✓ Backup complete!"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "Location: $BACKUP_FILE"

# Optional: Keep only last 5 backups
cd "$BACKUP_DIR"
ls -t changedetection-backup-*.tar.gz | tail -n +6 | xargs -r rm
echo "Kept last 5 backups, deleted older ones"
