#!/usr/bin/env bash
set -euo pipefail

BIN_DIR="$(dirname "$0")/../bin"
mkdir -p "$BIN_DIR"

# The static (musl) build has no shared library dependencies, so it runs on
# every Linux image. The GNU build needs libgraphite2, which the Azure App
# Service image does not ship.
is_static_build() {
  local binary="$1"
  [[ -x "$binary" ]] || return 1
  command -v ldd >/dev/null 2>&1 || return 0
  local output
  # ldd exits with a non-zero status for static binaries
  output="$(ldd "$binary" 2>&1 || true)"
  [[ "$output" == *"not a dynamic executable"* ]]
}

echo "[setup-tex] Checking for LaTeX compiler..."

if command -v tectonic &>/dev/null; then
  echo "[setup-tex] tectonic already installed globally"
  exit 0
fi

if is_static_build "$BIN_DIR/tectonic"; then
  echo "[setup-tex] tectonic already installed locally (static build)"
  exit 0
fi

if [[ -x "$BIN_DIR/tectonic" ]]; then
  echo "[setup-tex] the local tectonic build is not static, replacing it"
fi

echo "[setup-tex] Detecting platform..."
ARCH="x86_64-unknown-linux-musl"
UNAME=$(uname -m)
OS=$(uname -s)

if [[ "$OS" == "Darwin" ]]; then
  ARCH="x86_64-apple-darwin"
  if [[ "$UNAME" == "arm64" ]]; then
    ARCH="aarch64-apple-darwin"
  fi
elif [[ "$OS" == "Linux" ]]; then
  if [[ "$UNAME" == "aarch64" ]]; then
    ARCH="aarch64-unknown-linux-musl"
  else
    ARCH="x86_64-unknown-linux-musl"
  fi
else
  echo "[setup-tex] Unsupported OS: $OS"
  exit 1
fi

echo "[setup-tex] Downloading tectonic for $ARCH..."

LATEST_URL=$(curl -sL "https://api.github.com/repos/tectonic-typesetting/tectonic/releases/latest" \
  | grep -oP "\"browser_download_url\": \"\K[^\"]*${ARCH}\.tar\.gz" \
  | head -1)

if [[ -z "$LATEST_URL" ]]; then
  echo "[setup-tex] Failed to find download URL"
  exit 1
fi

curl -L --retry 3 "$LATEST_URL" -o /tmp/tectonic.tar.gz
tar -xzf /tmp/tectonic.tar.gz -C "$BIN_DIR"
rm /tmp/tectonic.tar.gz
chmod +x "$BIN_DIR/tectonic"

echo "[setup-tex] tectonic installed at $BIN_DIR/tectonic"
echo "[setup-tex] Done"
