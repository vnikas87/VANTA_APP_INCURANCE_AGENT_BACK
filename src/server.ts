import dotenv from 'dotenv';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import app from './app';
import { connectPrisma, disconnectPrisma } from './lib/prisma';

dotenv.config();

const port = Number(process.env.PORT || 3001);
const httpsEnabled = process.env.HTTPS_ENABLED === 'true';
const defaultKeyPath = path.resolve(process.cwd(), 'certs', 'server.key');
const defaultCertPath = path.resolve(process.cwd(), 'certs', 'server.crt');

const keyPath = process.env.HTTPS_KEY_PATH
  ? path.resolve(process.cwd(), process.env.HTTPS_KEY_PATH)
  : defaultKeyPath;
const certPath = process.env.HTTPS_CERT_PATH
  ? path.resolve(process.cwd(), process.env.HTTPS_CERT_PATH)
  : defaultCertPath;

async function start(): Promise<void> {
  await connectPrisma();

  const server = httpsEnabled
    ? https.createServer(
        {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        },
        app
      )
    : http.createServer(app);

  server.listen(port, () => {
    const protocol = httpsEnabled ? 'https' : 'http';
    console.log(`[API] Backend running on ${protocol}://localhost:${port}`);
  });

  const shutdown = async () => {
    console.log('[API] Shutting down');
    server.close(async () => {
      await disconnectPrisma();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('[BOOT] Failed to start backend', err);
  process.exit(1);
});
