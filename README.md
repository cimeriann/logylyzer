# Logylyzer - AI-Powered Log Analysis

Intelligent log monitoring and analysis with AI-powered insights.

## Quick Start

### One-Line Installation

```bash
curl -sSL https://raw.githubusercontent.com/cimeriann/logylyzer/main/agent/install.sh | sudo bash
```

This will:
- Auto-detect your system architecture
- Download the appropriate binary
- Install and start the monitoring agent
- Begin monitoring your services automatically

### Manual Installation

1. **Start the Analyzer Server**
   ```bash
   git clone https://github.com/cimeriann/logylyzer.git
   cd logylyzer
   npm install
   npm run dev
   ```

2. **Install the Agent**
   ```bash
   # Download for your platform
   curl -L https://github.com/cimeriann/logylyzer/releases/latest/download/logylyzer-agent-linux-amd64 -o logylyzer-agent
   chmod +x logylyzer-agent
   
   # Run with config
   ./logylyzer-agent --config config.yaml
   ```

## Features

- **🔍 Auto-Discovery**: Automatically detects Docker containers and systemd services
- **📊 Real-time Monitoring**: Monitors logs in real-time using tail and docker logs
- **🤖 AI Analysis**: Uses Google Gemini to analyze error patterns and suggest fixes
- **📈 Historical Tracking**: Stores analysis results with timestamps and service context
- **🚀 Zero Configuration**: Works out of the box with sensible defaults

## API Endpoints

### Analyze Logs
```bash
curl -X POST http://localhost:2576/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "logs": "ERROR: Database connection failed",
    "serviceName": "web-app",
    "source": "application"
  }'
```

### View Service History
```bash
# Today's analysis for a service
curl http://localhost:2576/api/monitor/history/web-app

# Specific date
curl http://localhost:2576/api/monitor/history/web-app?date=2025-12-10
```

### List Monitored Services
```bash
curl http://localhost:2576/api/monitor/services
```

## Configuration

The agent uses `/etc/logylyzer/config.yaml`:

```yaml
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
```

## Environment Variables

Create a `.env` file:

```env
PORT=2576
LLM_API_KEY=your-google-api-key
LLM_API_URL=https://generativelanguage.googleapis.com
LLM_MODEL=gemini-1.5-flash
```

## Supported Platforms

- Linux (AMD64, ARM64)
- macOS (Intel, Apple Silicon)
- Windows (AMD64)

## License

MIT License