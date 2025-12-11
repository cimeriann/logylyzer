import { Router } from 'express';
import { getServiceHistory, listServices } from '../controller/monitor.controller.ts';

const monitorRouter = Router();

monitorRouter.get('/history/:serviceName', getServiceHistory);
monitorRouter.get('/services', listServices);

export default monitorRouter;