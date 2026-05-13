import { readFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { spawn } from "node:child_process";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const maxAttempts = Number(process.env.DB_MIGRATION_ATTEMPTS ?? 30);
const delayMs = Number(process.env.DB_MIGRATION_DELAY_MS ?? 2000);

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
    await migrate();
    startServer();
    break;
  } catch (error) {
    if (attempt === maxAttempts) throw error;
    console.log(`[db] waiting for database (${attempt}/${maxAttempts})`);
    await sleep(delayMs);
  }
}

async function migrate() {
  const client = new pg.Client({
    connectionString,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  });

  await client.connect();
  try {
    await client.query(await readFile("lib/schema.sql", "utf8"));
    console.log("[db] schema is ready");
  } finally {
    await client.end();
  }
}

function startServer() {
  const child = spawn("node", ["server.js"], { stdio: "inherit", env: process.env });
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });
}
