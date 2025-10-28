#!/usr/bin/env node

/**
 * Display current version information
 */

const fs = require('fs');
const path = require('path');

try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  console.log(`Current version: ${packageJson.version}`);
} catch (error) {
  console.error('Error reading package.json:', error.message);
  process.exit(1);
}
