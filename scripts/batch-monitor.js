#!/usr/bin/env node

/**
 * Batch Monitor - Orchestrates source monitoring with priority-based scheduling
 *
 * This script coordinates the entire source monitoring process:
 * 1. Selects the next batch of claims to check based on priority
 * 2. Fetches source content and performs smart matching
 * 3. Detects changes compared to previous snapshots
 * 4. Updates batch state for next run
 *
 * The priority algorithm ensures:
 * - High-priority claims (contact info) checked every ~3 days
 * - Normal-priority claims checked every ~7 days
 * - Low-priority claims checked every ~30 days
 * - Recently changed claims get higher priority
 * - Very stable claims get lower priority
 *
 * Usage: node batch-monitor.js [batch-size]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default configuration
const DEFAULT_CONFIG = {
  batch: {
    defaultSize: 100,
    maxConcurrent: 5,
    retryAttempts: 3,
    retryDelay: 3000,
    requestTimeout: 20000
  },
  priority: {
    highCheckInterval: 3,   // days
    normalCheckInterval: 7,
    lowCheckInterval: 30
  },
  changeDetection: {
    confidenceDropThreshold: 0.3,
    similarityThreshold: 0.7
  }
};

/**
 * Load or initialize batch state
 */
function loadBatchState() {
  const stateFile = path.join(__dirname, 'batch-state.json');

  if (fs.existsSync(stateFile)) {
    return JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
  }

  // Initialize new state
  return {
    lastRun: null,
    currentBatch: 0,
    batchSize: DEFAULT_CONFIG.batch.defaultSize,
    checkHistory: {}
  };
}

/**
 * Save batch state
 */
function saveBatchState(state) {
  const stateFile = path.join(__dirname, 'batch-state.json');
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1, date2) {
  if (!date1 || !date2) return Infinity;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate priority score for a claim
 */
function calculatePriorityScore(claim, checkHistory, config) {
  const now = new Date().toISOString();
  const history = checkHistory[claim.id] || {};
  const daysSinceCheck = daysBetween(history.lastChecked, now);

  let score = 0;

  // Priority factor (30 points max)
  if (claim.priority === 'high') {
    score += 30;
  } else if (claim.priority === 'normal') {
    score += 20;
  } else {
    score += 10;
  }

  // Age factor (40 points max)
  // Prefer claims not checked recently
  const maxAge = 60; // Cap at 60 days for scoring
  const ageScore = Math.min(40, (daysSinceCheck / maxAge) * 40);
  score += ageScore;

  // Stability factor (30 points max)
  if (history.lastChanged) {
    const daysSinceChange = daysBetween(history.lastChanged, now);
    if (daysSinceChange < 30) {
      score += 30; // Changed recently, high priority
    } else if (daysSinceChange < 90) {
      score += 20;
    } else {
      score += 10;
    }
  } else if (history.consecutiveUnchanged && history.consecutiveUnchanged > 5) {
    score -= 10; // Very stable, lower priority
  }

  // Interval-based boost
  const interval = config.priority[`${claim.priority}CheckInterval`];
  if (daysSinceCheck >= interval) {
    score += 20; // Past due for check
  }

  return score;
}

/**
 * Select next batch of claims to check
 */
function selectNextBatch(claims, state, config, batchSize) {
  console.error('Calculating priority scores...');

  const scored = claims.map(claim => ({
    claim,
    score: calculatePriorityScore(claim, state.checkHistory, config)
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Take top N
  const batch = scored.slice(0, batchSize).map(s => s.claim);

  console.error(`Selected ${batch.length} claims from ${claims.length} total`);
  console.error(`  Priority breakdown: ${batch.filter(c => c.priority === 'high').length} high, ${batch.filter(c => c.priority === 'normal').length} normal, ${batch.filter(c => c.priority === 'low').length} low`);

  return batch;
}

/**
 * Update check history based on snapshot results
 */
function updateCheckHistory(state, snapshots, changes) {
  const now = new Date().toISOString();
  const changedIds = new Set(changes.map(c => c.claimId));

  snapshots.forEach(snapshot => {
    const history = state.checkHistory[snapshot.claimId] || {
      firstChecked: now,
      checkCount: 0,
      consecutiveUnchanged: 0,
      lastChanged: null
    };

    history.lastChecked = now;
    history.checkCount = (history.checkCount || 0) + 1;

    if (changedIds.has(snapshot.claimId)) {
      history.lastChanged = now;
      history.consecutiveUnchanged = 0;
    } else {
      history.consecutiveUnchanged = (history.consecutiveUnchanged || 0) + 1;
    }

    state.checkHistory[snapshot.claimId] = history;
  });
}

/**
 * Main orchestration function
 */
function main() {
  console.error('='.repeat(60));
  console.error('Source Monitor - Batch Processing');
  console.error('='.repeat(60));
  console.error('');

  // Parse arguments
  const batchSize = parseInt(process.argv[2]) || DEFAULT_CONFIG.batch.defaultSize;

  // Load configuration
  const configFile = path.join(__dirname, 'source-monitor-config.json');
  const config = fs.existsSync(configFile)
    ? JSON.parse(fs.readFileSync(configFile, 'utf-8'))
    : DEFAULT_CONFIG;

  console.error(`Batch size: ${batchSize}`);
  console.error('');

  // Load claims
  const claimsFile = path.join(__dirname, 'claim-sources.json');
  if (!fs.existsSync(claimsFile)) {
    console.error('Error: claim-sources.json not found. Run extract-claim-sources.js first.');
    process.exit(1);
  }

  const claimsData = JSON.parse(fs.readFileSync(claimsFile, 'utf-8'));
  const allClaims = claimsData.claims;

  console.error(`Loaded ${allClaims.length} claims`);

  // Load batch state
  const state = loadBatchState();
  console.error(`Last run: ${state.lastRun || 'never'}`);
  console.error(`Check history entries: ${Object.keys(state.checkHistory).length}`);
  console.error('');

  // Select batch
  const batch = selectNextBatch(allClaims, state, config, batchSize);

  // Write batch to temporary file
  const batchFile = path.join(__dirname, 'current-batch.json');
  const batchData = {
    metadata: claimsData.metadata,
    claims: batch
  };
  fs.writeFileSync(batchFile, JSON.stringify(batchData, null, 2));

  console.error('Step 1: Fetching source content...');
  console.error('-'.repeat(60));

  // Run fetch-source-content.js
  try {
    execSync(
      `node ${path.join(__dirname, 'fetch-source-content.js')} ${batchFile} ${path.join(__dirname, 'source-snapshots.json')}`,
      { stdio: 'inherit' }
    );
  } catch (error) {
    console.error('Error fetching source content:', error.message);
    process.exit(1);
  }

  console.error('');
  console.error('Step 2: Detecting changes...');
  console.error('-'.repeat(60));

  // Run detect-source-changes.js
  const previousSnapshotFile = path.join(__dirname, 'source-snapshots-previous.json');
  const changesReportFile = path.join(__dirname, 'source-changes-report.json');

  try {
    execSync(
      `node ${path.join(__dirname, 'detect-source-changes.js')} ${path.join(__dirname, 'source-snapshots.json')} ${previousSnapshotFile} ${changesReportFile}`,
      { stdio: 'inherit' }
    );
  } catch (error) {
    // Exit code 1 means high-severity changes detected, which is expected
    if (error.status !== 1) {
      console.error('Error detecting changes:', error.message);
      process.exit(1);
    }
  }

  console.error('');
  console.error('Step 3: Updating batch state...');
  console.error('-'.repeat(60));

  // Load results
  const snapshotsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'source-snapshots.json'), 'utf-8'));
  const snapshots = snapshotsData.snapshots;

  let changes = [];
  if (fs.existsSync(changesReportFile)) {
    const changesData = JSON.parse(fs.readFileSync(changesReportFile, 'utf-8'));
    changes = changesData.changes;
  }

  // Update state
  updateCheckHistory(state, snapshots, changes);
  state.lastRun = new Date().toISOString();
  state.currentBatch = (state.currentBatch || 0) + 1;

  saveBatchState(state);

  console.error(`Updated check history for ${snapshots.length} claims`);
  console.error(`Total claims checked so far: ${Object.keys(state.checkHistory).length}`);

  console.error('');
  console.error('='.repeat(60));
  console.error('Batch processing complete!');
  console.error('='.repeat(60));
  console.error('');
  console.error('Summary:');
  console.error(`  Batch #${state.currentBatch}`);
  console.error(`  Claims checked: ${snapshots.length}`);
  console.error(`  Changes detected: ${changes.length}`);
  if (changes.length > 0) {
    const highSeverity = changes.filter(c => c.severity === 'high').length;
    const mediumSeverity = changes.filter(c => c.severity === 'medium').length;
    const lowSeverity = changes.filter(c => c.severity === 'low').length;
    console.error(`    High: ${highSeverity}, Medium: ${mediumSeverity}, Low: ${lowSeverity}`);
  }
  console.error(`  Progress: ${Object.keys(state.checkHistory).length}/${allClaims.length} claims have been checked at least once`);

  // Copy current snapshots to previous for next run
  fs.copyFileSync(
    path.join(__dirname, 'source-snapshots.json'),
    previousSnapshotFile
  );

  console.error('');
  console.error('Files updated:');
  console.error(`  - batch-state.json`);
  console.error(`  - source-snapshots.json`);
  console.error(`  - source-snapshots-previous.json`);
  if (changes.length > 0) {
    console.error(`  - source-changes-report.json`);
  }
}

main();
