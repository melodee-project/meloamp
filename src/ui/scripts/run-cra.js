#!/usr/bin/env node
/**
 * Cross-platform wrapper around react-scripts.
 *
 * The package scripts previously used POSIX-only inline environment variables
 * (`BROWSERSLIST_IGNORE_OLD_DATA=1 react-scripts build`), which fail on Windows
 * `cmd`/PowerShell. Setting the variable here keeps the scripts identical on
 * Linux, macOS, and Windows without adding a dependency such as cross-env.
 */
'use strict';

const { spawn } = require('node:child_process');
const path = require('node:path');

process.env.BROWSERSLIST_IGNORE_OLD_DATA = process.env.BROWSERSLIST_IGNORE_OLD_DATA || '1';

const bin = path.join(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'react-scripts.cmd' : 'react-scripts',
);

const child = spawn(bin, process.argv.slice(2), {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

child.on('error', (error) => {
  console.error('[run-cra] Failed to start react-scripts:', error.message);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
