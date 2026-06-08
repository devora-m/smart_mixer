/*
 * Smart Mixer server entry point.
 * - loads .env
 * - opens SQLite + creates tables if needed
 * - connects to MongoDB
 * - starts the HTTP server (app.js)
 * - shuts down cleanly on SIGINT/SIGTERM
 */
require('dotenv').config();

const { connectMongo, disconnectMongo } = require('./db/mongo');
const { getDb, closeDb } = require('./db/sqlite');
const { initSqlite } = require('./seed/initSqlite');
const { createApp } = require('./app');

let httpServer = null;

async function main() {
  console.log('Starting Smart Mixer server...');

  // SQLite first (cheap, local, sync init)
  getDb();
  initSqlite();

  // Then Mongo
  await connectMongo();

  // HTTP
  const app = createApp();
  const port = parseInt(process.env.PORT, 10) || 4000;
  httpServer = app.listen(port, () => {
    console.log(`\nHTTP server listening on http://localhost:${port}`);
    console.log('Press Ctrl+C to stop.\n');
  });
}

async function shutdown() {
  console.log('\nShutting down...');
  if (httpServer) {
    await new Promise((r) => httpServer.close(r));
  }
  try { await disconnectMongo(); } catch (e) { /* ignore */ }
  try { closeDb(); } catch (e) { /* ignore */ }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});
