import { Router } from 'express';
import { analyzeLogs } from '../controller/analyze.controller.ts';

const analyzeRouter = Router();

analyzeRouter.post('/', analyzeLogs)

export default analyzeRouter;