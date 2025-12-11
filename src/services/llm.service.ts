import type { AnalyzeLogsRequestBody } from "../types/index.d.ts";
import axios from "axios";

export const analyseLogs = async (logs: AnalyzeLogsRequestBody["logs"]) => {
	const apiKey = process.env.LLM_API_KEY;
	const baseUrl = process.env.LLM_API_URL;
	
	
	const prompt = `You are a DevOps AI Assistant. Analyze the following logs and return a JSON response with this exact structure:

{
  "rootCause": "Brief description of the root cause",
  "severity": "low|medium|high|critical",
  "suggestedFix": "Detailed fix instructions",
  "patternsDetected": ["pattern1", "pattern2"]
}

Logs:
${logs}

Return only valid JSON, no additional text.`;
	
	try {
		const response = await axios.post(
			`${baseUrl}/v1beta/models/${process.env.LLM_MODEL}:generateContent?key=${apiKey}`,
			{
				contents: [{
					parts: [{
						text: prompt
					}]
				}]
			},
			{
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		const aiResponse = response.data.candidates[0].content.parts[0].text;
		
		try {
			return JSON.parse(aiResponse);
		} catch (parseError) {
			// Fallback if AI doesn't return valid JSON
			return {
				rootCause: "Analysis completed",
				severity: "medium",
				suggestedFix: aiResponse,
				patternsDetected: ["Raw AI response"]
			};
		}
	} catch (error: any) {
		console.error('LLM Service Error:', error.response?.data || error.message);
		throw error;
	}
};