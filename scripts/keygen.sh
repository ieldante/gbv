#!/usr/bin/env bash
set -euo pipefail

# Generates a 256-bit HMAC secret as hex (64 chars).
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"