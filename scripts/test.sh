#!/bin/sh
#
# Run the test suite with a deterministic timezone so timestamp assertions
# behave the same everywhere. Set TZ to override the default.
#
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

TZ="${TZ:-Europe/Berlin}" node --test "$ROOT"/scripts/*.test.js
