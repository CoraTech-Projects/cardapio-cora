import express from 'express';
import { db } from '../structures/db.js';
import temp from '../utils/tempReady.js';

const MonitorRouter = express.Router();

MonitorRouter.get('/', (req: any, res: any) =>
  res.sendFile('monitor.html', { root: './src/public/_MONITOR' })
);

MonitorRouter.get('/temp-stats', (req: any, res: any) => {
  if (!req.cookies.token)
    return res.status(408).json({
      message: 'não autorizado.',
    });
  if (!temp.temp) return res.status(204).json();
  res.status(200).json({
    stats: temp.temp,
  });
});

export { MonitorRouter };
