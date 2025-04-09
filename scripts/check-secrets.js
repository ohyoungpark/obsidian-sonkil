#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// API 키 패턴 정의
const SECRET_PATTERNS = [
  // AWS
  /AKIA[0-9A-Z]{16}/,
  // GitHub
  /ghp_[a-zA-Z0-9]{36}/,
  /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/,
  // Google
  /AIza[0-9A-Za-z-_]{35}/,
  // 일반적인 API 키 패턴
  /[a-zA-Z0-9]{32,}/,
  // 환경 변수
  /process\.env\.[A-Z_]+/,
];

// 검사할 파일 확장자
const TARGET_EXTENSIONS = ['.js', '.ts', '.json', '.env', '.config'];

// 검사에서 제외할 파일들
const EXCLUDED_FILES = ['package-lock.json', 'yarn.lock', 'main.tmp.js'];

function checkFile(filePath) {
  if (EXCLUDED_FILES.includes(path.basename(filePath))) {
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let hasSecrets = false;

  SECRET_PATTERNS.forEach(pattern => {
    if (pattern.test(content)) {
      console.error(`\x1b[31mPotential secret found in ${filePath}\x1b[0m`);
      hasSecrets = true;
    }
  });

  return hasSecrets;
}

function main() {
  const stagedFiles = execSync('git diff --cached --name-only')
    .toString()
    .split('\n')
    .filter(file => file && TARGET_EXTENSIONS.some(ext => file.endsWith(ext)));

  let hasSecrets = false;

  stagedFiles.forEach(file => {
    if (checkFile(file)) {
      hasSecrets = true;
    }
  });

  if (hasSecrets) {
    console.error('\x1b[31mCommit rejected: Potential secrets found in staged files\x1b[0m');
    process.exit(1);
  }
}

main();