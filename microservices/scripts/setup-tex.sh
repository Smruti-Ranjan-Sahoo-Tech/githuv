#!/usr/bin/env bash
set -euo pipefail

BIN_DIR="$(dirname "$0")/../bin"
mkdir -p "$BIN_DIR"

echo "[setup-tex] Checking for LaTeX compiler..."

if command -v tectonic &>/dev/null; then
  echo "[setup-tex] tectonic already installed globally"
  exit 0
fi

if [[ -x "$BIN_DIR/tectonic" ]]; then
  echo "[setup-tex] tectonic already installed locally"
  exit 0
fi

echo "[setup-tex] Detecting platform..."
ARCH="x86_64-unknown-linux-gnu"
UNAME=$(uname -m)
OS=$(uname -s)

if [[ "$OS" == "Darwin" ]]; then
  ARCH="x86_64-apple-darwin"
  if [[ "$UNAME" == "arm64" ]]; then
    ARCH="aarch64-apple-darwin"
  fi
elif [[ "$OS" == "Linux" ]]; then
  if [[ "$UNAME" == "aarch64" ]]; then
    ARCH="aarch64-unknown-linux-gnu"
  else
    ARCH="x86_64-unknown-linux-gnu"
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
