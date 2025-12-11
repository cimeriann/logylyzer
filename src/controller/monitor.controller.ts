import type { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

export const getServiceHistory = async (req: Request, res: Response) => {
  try {
    const { serviceName } = req.params;
    const { date } = req.query;
    
    const logsDir = './analysis-logs';
    const filename = date 
      ? `${serviceName}-${date}.json`
      : `${serviceName}-${new Date().toISOString().split('T')[0]}.json`;
    
    const filepath = path.join(logsDir, filename);
    
    try {
      const data = await fs.readFile(filepath, 'utf-8');
      const entries = JSON.parse(data);
      
      res.json({
        success: true,
        serviceName,
        date: date || new Date().toISOString().split('T')[0],
        entries,
        count: entries.length
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: `No analysis history found for ${serviceName}`,
        serviceName
      });
    }
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analysis history'
    });
  }
};

export const listServices = async (req: Request, res: Response) => {
  try {
    const logsDir = './analysis-logs';
    
    try {
      const files = await fs.readdir(logsDir);
      const services = [...new Set(
        files
          .filter(file => file.endsWith('.json'))
          .map(file => file.split('-')[0])
      )];
      
      res.json({
        success: true,
        services,
        count: services.length
      });
    } catch (error) {
      res.json({
        success: true,
        services: [],
        count: 0
      });
    }
  } catch (error) {
    console.error('Error listing services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list services'
    });
  }
};