package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"

	"gopkg.in/yaml.v2"
)

type Config struct {
	Analyzer struct {
		Endpoint string `yaml:"endpoint"`
	} `yaml:"analyzer"`
	Discovery struct {
		Enabled      bool   `yaml:"enabled"`
		ScanInterval string `yaml:"scan_interval"`
	} `yaml:"discovery"`
	Monitoring struct {
		LogPaths        []string `yaml:"log_paths"`
		ExcludePatterns []string `yaml:"exclude_patterns"`
	} `yaml:"monitoring"`
	Services struct {
		AutoDetect bool `yaml:"auto_detect"`
		Docker     bool `yaml:"docker"`
		Systemd    bool `yaml:"systemd"`
	} `yaml:"services"`
}

type LogAnalysisRequest struct {
	Logs        string `json:"logs"`
	ServiceName string `json:"serviceName"`
	Source      string `json:"source"`
}

type Service struct {
	Name   string
	Type   string
	Status string
}

func main() {
	configPath := "/etc/logylyzer/config.yaml"
	if len(os.Args) > 2 && os.Args[1] == "--config" {
		configPath = os.Args[2]
	}

	config, err := loadConfig(configPath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	log.Println("Logylyzer Agent starting...")

	// Discover services
	services := discoverServices(config)
	log.Printf("📋 Discovered %d services", len(services))

	// Start monitoring
	startMonitoring(config, services)
}

func loadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var config Config
	err = yaml.Unmarshal(data, &config)
	return &config, err
}

func discoverServices(config *Config) []Service {
	var services []Service

	if config.Services.Docker {
		services = append(services, discoverDockerServices()...)
	}

	if config.Services.Systemd {
		services = append(services, discoverSystemdServices()...)
	}

	return services
}

func discoverDockerServices() []Service {
	var services []Service

	cmd := exec.Command("docker", "ps", "--format", "{{.Names}}")
	output, err := cmd.Output()
	if err != nil {
		log.Printf("⚠️  Docker not available: %v", err)
		return services
	}

	containers := strings.Split(strings.TrimSpace(string(output)), "\n")
	for _, container := range containers {
		if container != "" {
			services = append(services, Service{
				Name:   container,
				Type:   "docker",
				Status: "running",
			})
		}
	}

	return services
}

func discoverSystemdServices() []Service {
	var services []Service

	cmd := exec.Command("systemctl", "list-units", "--type=service", "--state=active", "--no-header")
	output, err := cmd.Output()
	if err != nil {
		log.Printf("⚠️  Systemd not available: %v", err)
		return services
	}

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) > 0 {
			serviceName := strings.TrimSuffix(fields[0], ".service")
			services = append(services, Service{
				Name:   serviceName,
				Type:   "systemd",
				Status: "active",
			})
		}
	}

	return services
}

func startMonitoring(config *Config, services []Service) {
	// Monitor log files
	go monitorLogFiles(config)

	// Monitor service logs
	for _, service := range services {
		go monitorServiceLogs(config, service)
	}

	// Keep running
	select {}
}

func monitorLogFiles(config *Config) {
	for _, pattern := range config.Monitoring.LogPaths {
		matches, err := filepath.Glob(pattern)
		if err != nil {
			continue
		}

		for _, logFile := range matches {
			go tailLogFile(config, logFile)
		}
	}
}

func tailLogFile(config *Config, logFile string) {
	log.Printf("📄 Monitoring log file: %s", logFile)

	cmd := exec.Command("tail", "-f", logFile)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return
	}

	if err := cmd.Start(); err != nil {
		return
	}

	buf := make([]byte, 1024)
	for {
		n, err := stdout.Read(buf)
		if err != nil {
			break
		}

		logLine := string(buf[:n])
		if shouldAnalyze(logLine) {
			serviceName := extractServiceName(logFile)
			sendForAnalysis(config, logLine, serviceName, "file")
		}
	}
}

func monitorServiceLogs(config *Config, service Service) {
	var cmd *exec.Cmd

	switch service.Type {
	case "docker":
		cmd = exec.Command("docker", "logs", "-f", service.Name)
	case "systemd":
		cmd = exec.Command("journalctl", "-u", service.Name, "-f")
	default:
		return
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return
	}

	if err := cmd.Start(); err != nil {
		return
	}

	log.Printf("🔍 Monitoring %s service: %s", service.Type, service.Name)

	buf := make([]byte, 1024)
	for {
		n, err := stdout.Read(buf)
		if err != nil {
			break
		}

		logLine := string(buf[:n])
		if shouldAnalyze(logLine) {
			sendForAnalysis(config, logLine, service.Name, service.Type)
		}
	}
}

func shouldAnalyze(logLine string) bool {
	errorPatterns := []string{
		"(?i)error",
		"(?i)fatal",
		"(?i)exception",
		"(?i)failed",
		"(?i)timeout",
		"(?i)refused",
	}

	for _, pattern := range errorPatterns {
		matched, _ := regexp.MatchString(pattern, logLine)
		if matched {
			return true
		}
	}

	return false
}

func extractServiceName(logFile string) string {
	base := filepath.Base(logFile)
	return strings.TrimSuffix(base, filepath.Ext(base))
}

func sendForAnalysis(config *Config, logs, serviceName, source string) {
	request := LogAnalysisRequest{
		Logs:        logs,
		ServiceName: serviceName,
		Source:      source,
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return
	}

	resp, err := http.Post(
		config.Analyzer.Endpoint+"/api/analyze",
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		log.Printf("⚠️  Failed to send analysis: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 {
		log.Printf("✅ Analysis sent for %s", serviceName)
	}
}