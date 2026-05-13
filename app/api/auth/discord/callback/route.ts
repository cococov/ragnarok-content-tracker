import { NextResponse } from "next/server";

import {
  createSession,
  setSessionCookie,
  upsertDiscordUser,
  verifyOauthState,
} from "@/lib/auth";
import { getRequiredEnv } from "@/lib/env";
import { getAppBaseUrl, getDiscordRedirectUri } from "@/lib/url";

type DiscordTokenResponse = {
  access_token: string;
  token_type: string;
};

type DiscordUserResponse = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const origin = getAppBaseUrl(request);

  if (!code || !(await verifyOauthState(state))) {
    return NextResponse.redirect(`${origin}/?auth=invalid`);
  }

  const token = await exchangeCodeForToken(code, getDiscordRedirectUri(request));
  const discordUser = await fetchDiscordUser(token);
  const user = await upsertDiscordUser(discordUser);

  await setSessionCookie(await createSession(user.id));
  return NextResponse.redirect(origin);
}

async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<DiscordTokenResponse> {
  const body = new URLSearchParams({
    client_id: getRequiredEnv("DISCORD_CLIENT_ID"),
    client_secret: getRequiredEnv("DISCORD_CLIENT_SECRET"),
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) throw new Error("Discord token exchange failed.");
  return response.json();
}

async function fetchDiscordUser(token: DiscordTokenResponse): Promise<DiscordUserResponse> {
  const response = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `${token.token_type} ${token.access_token}` },
  });

  if (!response.ok) throw new Error("Discord user fetch failed.");
  return response.json();
}
