import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analyzeRouter from './routes/analyze.route.ts';
import monitorRouter from './routes/monitor.route.ts';

dotenv.config();

const PORT = process.env.PORT || 2576;
const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

app.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Test route working' });
});

app.use("/api/analyze", analyzeRouter);
app.use("/api/monitor", monitorRouter);

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.log('Uncaught Exception:', error);
});

app.listen(PORT, () => {
  console.log(`AI Log Analyzer  running on port ${PORT}`);
});

