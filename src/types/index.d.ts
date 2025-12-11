export interface AnalyzeLogsRequestBody {
  logs: string;
  source?: string;        // e.g. "nginx", "docker", "node"
  serviceName?: string;   // name of the service being monitored
  timestamp?: string;     // optional timestamp
}

export interface AnalysisResult {
  rootCause: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedFix: string;
  patternsDetected: string[];
}

export interface LogEntry {
  timestamp: string;
  serviceName: string;
  source?: string | undefined;
  analysis: AnalysisResult;
  originalLogs: string;
}