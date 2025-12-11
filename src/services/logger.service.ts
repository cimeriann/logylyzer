import fs from 'fs/promises';
import path from 'path';
import type { LogEntry } from '../types/index.d.ts';

const LOGS_DIR = './analysis-logs';

export const ensureLogsDirectory = async () => {
  try {
    await fs.access(LOGS_DIR);
  } catch {
    await fs.mkdir(LOGS_DIR, { recursive: true });
  }
};

export const exportAnalysis = async (logEntry: LogEntry) => {
  await ensureLogsDirectory();
  
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `${logEntry.serviceName}-${date}.json`;
  const filepath = path.join(LOGS_DIR, filename);
  
  try {
    // Read existing entries
    let entries: LogEntry[] = [];
    try {
      const existingData = await fs.readFile(filepath, 'utf-8');
      entries = JSON.parse(existingData);
    } catch {
      // File doesn't exist yet, start with empty array
    }
    
    // Add new entry
    entries.push(logEntry);
    
    // Write back to file
    await fs.writeFile(filepath, JSON.stringify(entries, null, 2));
    
    console.log(`Analysis exported to ${filepath}`);
  } catch (error) {
    console.error('Failed to export analysis:', error);
    throw error;
  }
};