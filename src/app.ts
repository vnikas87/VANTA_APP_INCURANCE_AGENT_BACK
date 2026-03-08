import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import path from 'path';
import { auditLogMiddleware } from './middleware/auditLog';
import apiRoutes from './routes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(
  morgan(':date[iso] :method :url :status :response-time ms - :res[content-length] bytes')
);
app.use(auditLogMiddleware);
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.use('/api', apiRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERR]', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
