#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)

for image in "$script_dir"/../public/maps/*/*.png; do
  dir=$(dirname "$image")
  filename=$(basename "$image" .png)
  output_dir="$dir/${filename}-tiles"

  vips dzsave "$image" "$output_dir" --layout google --tile-size 256 --overlap 0 --depth one --suffix .png

  if [ "${CI:-false}" == "true" ]; then
    rm "$image"
  fi
done
