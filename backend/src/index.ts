import { initDb } from './db';
import { createApp } from './app';

async function main() {
  await initDb();

  const app = createApp();
  const PORT = Number(process.env.PORT || 8765);
  const HOST = process.env.HOST || '127.0.0.1';

  app.listen(PORT, HOST, () => {
    console.log(`Apiquick server running at http://${HOST}:${PORT}`);
  });
}

main().catch(console.error);
