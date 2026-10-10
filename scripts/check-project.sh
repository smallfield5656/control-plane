#!/usr/bin/env bash
set -euo pipefail

npm --prefix packages/cli test

(
  cd template
  bash scripts/check.sh
)
