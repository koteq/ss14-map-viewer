#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)

git -C ss14-sunrise diff > "$script_dir/../patches/map-renderer.patch"
