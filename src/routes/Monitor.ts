import express from 'express';
import { db } from '../structures/db.js';
const MonitorRouter = express.Router();

MonitorRouter.get('/', (req: any, res: any) =>
  res.sendFile('monitor.html', { root: './src/public/_MONITOR' })
);

export { MonitorRouter };
