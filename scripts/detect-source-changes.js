#!/usr/bin/env node

/**
 * Detect meaningful changes in source content
 *
 * Compares current snapshots with previous snapshots to identify when
 * claim-supporting text has changed on source pages. Filters out
 * insignificant changes to minimize false positives.
 *
 * Output: source-changes-report.json containing detected changes with:
 * - Severity level (high/medium/low)
 * - Change reason and details
 * - Previous vs current context
 * - Human-readable description
 *
 * Usage: node detect-source-changes.js [current-snapshots] [previous-snapshots] [output-file]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { compareTwoStrings } from 'string-similarity';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIDENCE_DROP_THRESHOLD = 0.3;
const SIMILARITY_THRESHOLD = 0.7;

/**
 * Detect changes between current and previous snapshots
 */
function detectChanges(currentSnapshot, previousSnapshot) {
  // No previous snapshot = first run, not a change
  if (!previousSnapshot) {
    return {
      changed: false,
      reason: 'first-run',
      details: 'No previous snapshot available for comparison'
    };
  }

  // Claim was found before but not now - potentially HIGH severity
  if (previousSnapshot.claimFound && !currentSnapshot.claimFound) {
    return {
      changed: true,
      severity: 'high',
      reason: 'claim-disappeared',
      details: 'Claim was found on previous check but not found now',
      previousContext: previousSnapshot.matchContext,
      currentContext: null
    };
  }

  // Claim not found before but found now - could be false positive previously
  if (!previousSnapshot.claimFound && currentSnapshot.claimFound) {
    return {
      changed: true,
      severity: 'low',
      reason: 'claim-appeared',
      details: 'Claim was not found previously but found now (may indicate previous false negative)',
      previousContext: null,
      currentContext: currentSnapshot.matchContext
    };
  }

  // Both not found - no change
  if (!previousSnapshot.claimFound && !currentSnapshot.claimFound) {
    return {
      changed: false,
      reason: 'both-not-found',
      details: 'Claim not found in either snapshot'
    };
  }

  // Both found - check for changes in confidence or content

  // Confidence drop - MEDIUM severity
  const confidenceDrop = previousSnapshot.matchConfidence - currentSnapshot.matchConfidence;
  if (confidenceDrop > CONFIDENCE_DROP_THRESHOLD) {
    return {
      changed: true,
      severity: 'medium',
      reason: 'confidence-drop',
      details: `Match confidence dropped from ${previousSnapshot.matchConfidence.toFixed(2)} to ${currentSnapshot.matchConfidence.toFixed(2)}`,
      previousContext: previousSnapshot.matchContext,
      currentContext: currentSnapshot.matchContext
    };
  }

  // Content hash changed - check similarity
  if (currentSnapshot.contentHash !== previousSnapshot.contentHash) {
    // Calculate text similarity
    const similarity = compareTwoStrings(
      previousSnapshot.matchContext || '',
      currentSnapshot.matchContext || ''
    );

    if (similarity < SIMILARITY_THRESHOLD) {
      return {
        changed: true,
        severity: 'high',
        reason: 'content-changed',
        details: `Surrounding content changed significantly (${(similarity * 100).toFixed(0)}% similar)`,
        previousContext: previousSnapshot.matchContext,
        currentContext: currentSnapshot.matchContext,
        similarity
      };
    }

    // Minor content change - likely just formatting or irrelevant updates
    return {
      changed: true,
      severity: 'low',
      reason: 'minor-content-change',
      details: `Content changed slightly (${(similarity * 100).toFixed(0)}% similar, above threshold)`,
      previousContext: previousSnapshot.matchContext,
      currentContext: currentSnapshot.matchContext,
      similarity
    };
  }

  // No significant changes
  return {
    changed: false,
    reason: 'no-change',
    details: 'No significant changes detected'
  };
}

/**
 * Generate human-readable change description
 */
function generateHumanReadable(claim, changeInfo) {
  const descriptions = {
    'claim-disappeared': `The claim "${claim.searchableCore}" could not be found on the source page. It may have been removed or reformatted.`,

    'claim-appeared': `The claim "${claim.searchableCore}" was found on the source page (previously not found). The previous check may have been a false negative.`,

    'confidence-drop': `The confidence of finding "${claim.searchableCore}" dropped significantly. The source page may have been reformatted.`,

    'content-changed': `The text surrounding "${claim.searchableCore}" has changed significantly on the source page.`,

    'minor-content-change': `Minor changes detected near "${claim.searchableCore}" but likely not significant.`
  };

  return descriptions[changeInfo.reason] || 'Change detected';
}

/**
 * Main function
 */
function main() {
  const currentFile = process.argv[2] || path.join(__dirname, 'source-snapshots.json');
  const previousFile = process.argv[3] || path.join(__dirname, 'source-snapshots-previous.json');
  const outputFile = process.argv[4] || path.join(__dirname, 'source-changes-report.json');

  console.error('Loading snapshots...');

  // Load current snapshots
  if (!fs.existsSync(currentFile)) {
    console.error(`Error: Current snapshots file not found: ${currentFile}`);
    process.exit(1);
  }

  const currentData = JSON.parse(fs.readFileSync(currentFile, 'utf-8'));
  const currentSnapshots = currentData.snapshots;

  // Load previous snapshots (may not exist on first run)
  let previousSnapshots = [];
  if (fs.existsSync(previousFile)) {
    const previousData = JSON.parse(fs.readFileSync(previousFile, 'utf-8'));
    previousSnapshots = previousData.snapshots;
    console.error(`Comparing ${currentSnapshots.length} current snapshots with ${previousSnapshots.length} previous snapshots...`);
  } else {
    console.error(`No previous snapshots found (first run). All current snapshots will be baseline.`);
  }

  // Create lookup map for previous snapshots
  const previousMap = new Map();
  previousSnapshots.forEach(snap => {
    previousMap.set(snap.claimId, snap);
  });

  // Load claim data for context
  const claimsFile = path.join(__dirname, 'claim-sources.json');
  let claimsMap = new Map();
  if (fs.existsSync(claimsFile)) {
    const claimsData = JSON.parse(fs.readFileSync(claimsFile, 'utf-8'));
    claimsData.claims.forEach(claim => {
      claimsMap.set(claim.id, claim);
    });
  }

  // Detect changes
  const changes = [];
  let highSeverity = 0;
  let mediumSeverity = 0;
  let lowSeverity = 0;

  currentSnapshots.forEach(currentSnap => {
    const previousSnap = previousMap.get(currentSnap.claimId);
    const changeInfo = detectChanges(currentSnap, previousSnap);

    if (changeInfo.changed) {
      const claim = claimsMap.get(currentSnap.claimId);

      const change = {
        claimId: currentSnap.claimId,
        file: claim?.file || 'unknown',
        line: claim?.line || 0,
        sourceUrl: currentSnap.sourceUrl,
        claimType: claim?.claimType || 'unknown',
        claimText: claim?.claimText || '',
        searchableCore: claim?.searchableCore || '',
        severity: changeInfo.severity,
        reason: changeInfo.reason,
        details: changeInfo.details,
        previousContext: changeInfo.previousContext,
        currentContext: changeInfo.currentContext,
        similarity: changeInfo.similarity,
        humanReadable: generateHumanReadable(claim || { searchableCore: currentSnap.claimId }, changeInfo)
      };

      changes.push(change);

      // Count by severity
      if (changeInfo.severity === 'high') highSeverity++;
      else if (changeInfo.severity === 'medium') mediumSeverity++;
      else if (changeInfo.severity === 'low') lowSeverity++;
    }
  });

  console.error(`\nDetected ${changes.length} changes:`);
  console.error(`  High severity: ${highSeverity}`);
  console.error(`  Medium severity: ${mediumSeverity}`);
  console.error(`  Low severity: ${lowSeverity}`);

  // Generate report
  const report = {
    metadata: {
      comparedAt: new Date().toISOString(),
      currentSnapshotDate: currentData.metadata.snapshotAt,
      previousSnapshotDate: previousSnapshots.length > 0
        ? (JSON.parse(fs.readFileSync(previousFile, 'utf-8')).metadata.snapshotAt)
        : null,
      totalChanges: changes.length,
      highSeverity,
      mediumSeverity,
      lowSeverity
    },
    changes: changes.sort((a, b) => {
      // Sort by severity (high first), then by file/line
      const severityOrder = { high: 0, medium: 1, low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      if (a.file !== b.file) return a.file.localeCompare(b.file);
      return a.line - b.line;
    })
  };

  // Write report
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
  console.error(`\nReport written to: ${outputFile}`);

  // Exit with code 1 if high-severity changes detected (for CI)
  if (highSeverity > 0) {
    console.error(`\nWARNING: ${highSeverity} high-severity changes detected!`);
    process.exit(1);
  }
}

main();
