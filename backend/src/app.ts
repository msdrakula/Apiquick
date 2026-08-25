import express from 'express';
import cors from 'cors';
import path from 'path';
import collectionsRouter from './routes/collections';
import requestsRouter from './routes/requests';
import environmentsRouter from './routes/environments';
import historyRouter from './routes/history';
import executeRouter from './routes/execute';
import cookiesRouter from './routes/cookies';
import globalsRouter from './routes/globals';
import importExportRouter from './routes/import-export';
import grpcRouter from './routes/grpc';
import settingsRouter from './routes/settings';
import gitRouter from './routes/git';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: [
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://localhost:5173',
      'http://127.0.0.1:8765',
      'http://localhost:8765',
    ],
  }));
  app.use(express.json({ limit: '50mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, name: 'apiquick' });
  });

  app.use('/collections', collectionsRouter);
  app.use('/requests', requestsRouter);
  app.use('/environments', environmentsRouter);
  app.use('/history', historyRouter);
  app.use('/execute', executeRouter);
  app.use('/cookies', cookiesRouter);
  app.use('/globals', globalsRouter);
  app.use('/import-export', importExportRouter);
  app.use('/execute-grpc', grpcRouter);
  app.use('/settings', settingsRouter);
  app.use('/git', gitRouter);

  const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
      if (err) next();
    });
  });

  return app;
}
