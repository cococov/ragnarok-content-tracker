export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function shouldUseDbSsl(): boolean {
  return process.env.DATABASE_SSL === "true";
}
