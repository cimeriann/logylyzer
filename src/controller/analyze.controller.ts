import type { Request, Response } from "express";
import type { AnalyzeLogsRequestBody, LogEntry } from "../types/index.d.ts";
import { analyseLogs } from "../services/llm.service.ts";
import { exportAnalysis } from "../services/logger.service.ts";

export const analyzeLogs = async (req: Request<{}, {}, AnalyzeLogsRequestBody>, res: Response) =>{
	try {
		const { logs, serviceName = 'unknown-service', source } = req.body;

		if (!logs) {
			return res.status(400).json({
				message: "No logs provided",
			});
		}

		const analysis = await analyseLogs(logs);

		// Create log entry for export
		const logEntry: LogEntry = {
			timestamp: new Date().toISOString(),
			serviceName,
			source,
			analysis,
			originalLogs: logs
		};

		// Export to log file (don't wait for it)
		exportAnalysis(logEntry).catch(err => 
			console.error('Failed to export analysis:', err)
		);

		return res.json({
			success: true,
			analysis,
			serviceName,
			timestamp: logEntry.timestamp
		});

	} catch (error) {
		console.error("LLM Error:", error);
		return res.status(500).json({
			message: "AI analysis failed, Internal server error",
		});
	}
}
