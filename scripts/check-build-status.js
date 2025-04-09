#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

function calculateChecksum(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function checkBuildStatus() {
  const mainJsPath = path.join(process.cwd(), 'main.js');
  const tempJsPath = path.join(process.cwd(), 'main.tmp.js');

  try {
    // Calculate checksum of current main.js
    const originalChecksum = calculateChecksum(mainJsPath);

    // Build using actual esbuild.config.mjs (only changing output file to main.tmp.js)
    execSync('node esbuild.config.mjs production', {
      stdio: 'pipe',
      env: { ...process.env, OUT_FILE: 'main.tmp.js' }
    });

    // Calculate checksum of newly built file
    const newChecksum = calculateChecksum(tempJsPath);

    // Compare checksums
    if (originalChecksum !== newChecksum) {
      // If checksums differ, overwrite main.js with the temporary file
      fs.copyFileSync(tempJsPath, mainJsPath);
      console.error('\x1b[31mError: main.js is outdated and has been updated. Please review changes and commit again.\x1b[0m');
      process.exit(1);
    }

    // Clean up temporary file on success
    fs.unlinkSync(tempJsPath);

    console.log('\x1b[32mBuild status check passed.\x1b[0m');
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31mError during build verification:', error.message, '\x1b[0m');

    // Try to clean up temporary file on error
    try {
      if (fs.existsSync(tempJsPath)) fs.unlinkSync(tempJsPath);
    } catch (cleanupError) {
      console.error('\x1b[31mError cleaning up temporary file:', cleanupError.message, '\x1b[0m');
    }

    process.exit(1);
  }
}

checkBuildStatus();