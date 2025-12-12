#!/bin/bash

set -e

INSTALL_DIR="/opt/logylyzer"
CONFIG_DIR="/etc/logylyzer"
SERVICE_FILE="/etc/systemd/system/logylyzer-agent.service"
GITHUB_REPO="cimeriann/logylyzer"  # Update this to your GitHub username/repo

echo "🔍 Installing Logylyzer Agent..."

# Detect architecture
ARCH=$(uname -m)
OS=$(uname -s | tr '[:upper:]' '[:lower:]')

case $ARCH in
    x86_64) ARCH="amd64" ;;
    aarch64|arm64) ARCH="arm64" ;;
    *) echo "❌ Unsupported architecture: $ARCH"; exit 1 ;;
esac

case $OS in
    linux) OS="linux" ;;
    darwin) OS="darwin" ;;
    *) echo "❌ Unsupported OS: $OS"; exit 1 ;;
esac

BINARY_NAME="logylyzer-agent-${OS}-${ARCH}"
BINARY_URL="https://github.com/${GITHUB_REPO}/releases/latest/download/${BINARY_NAME}"

echo "📋 Detected: $OS $ARCH"
echo "📥 Download URL: $BINARY_URL"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)" 
   exit 1
fi

# Create directories
mkdir -p $INSTALL_DIR
mkdir -p $CONFIG_DIR

# Download agent binary
echo "📥 Downloading agent..."
curl -L $BINARY_URL -o $INSTALL_DIR/logylyzer-agent
chmod +x $INSTALL_DIR/logylyzer-agent

# Create default config
cat > $CONFIG_DIR/config.yaml << EOF
# Logylyzer Agent Configuration
analyzer:
  endpoint: "http://localhost:2576"
  
discovery:
  enabled: true
  scan_interval: "30s"
  
monitoring:
  log_paths:
    - "/var/log/*.log"
    - "/var/log/*/*.log"
  exclude_patterns:
    - "*.gz"
    - "*.zip"
  
services:
  auto_detect: true
  docker: true
  systemd: true
EOF

# Create systemd service
cat > $SERVICE_FILE << EOF
[Unit]
Description=Logylyzer Log Analysis Agent
After=network.target

[Service]
Type=simple
User=root
ExecStart=$INSTALL_DIR/logylyzer-agent --config $CONFIG_DIR/config.yaml
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable logylyzer-agent
systemctl start logylyzer-agent

echo "✅ Logylyzer Agent installed successfully!"
echo "📊 Agent is now monitoring your system"
echo "🔧 Config: $CONFIG_DIR/config.yaml"
echo "📋 Status: systemctl status logylyzer-agent"
echo "📝 Logs: journalctl -u logylyzer-agent -f"