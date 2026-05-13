import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { copyFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const envPath = join(root, ".env");
const envExamplePath = join(root, ".env.example");

if (!existsSync(envPath)) {
  await copyFile(envExamplePath, envPath);
  console.log("Created .env from .env.example");
}

const env = parseEnv(readFileSync(envPath, "utf8"));
for (const [key, value] of Object.entries(env)) {
  if (!process.env[key]) process.env[key] = value;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required in .env");

const schema = await readFile(join(root, "lib/schema.sql"), "utf8");
const client = new pg.Client({
  connectionString,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
});

await client.connect();
try {
  await client.query(schema);
  console.log("Postgres schema is ready.");
} finally {
  await client.end();
}

writeFileSync(join(root, ".env"), serializeEnv(env));

function parseEnv(source) {
  const out = {};
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    out[key] = rawValue.replace(/^["']|["']$/g, "");
  }
  return out;
}

function serializeEnv(env) {
  return `${Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")}\n`;
}
