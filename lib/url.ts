import "server-only";

export function getAppBaseUrl(request: Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const headers = request.headers;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const proto =
    headers.get("x-forwarded-proto") ??
    new URL(request.url).protocol.replace(":", "");

  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

export function getDiscordRedirectUri(request: Request): string {
  return `${getAppBaseUrl(request)}/api/auth/discord/callback`;
}
