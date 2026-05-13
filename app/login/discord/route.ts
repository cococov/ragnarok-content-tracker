import { NextResponse } from "next/server";

import { createOauthState } from "@/lib/auth";
import { getRequiredEnv } from "@/lib/env";
import { getDiscordRedirectUri } from "@/lib/url";

export async function GET(request: Request) {
  const state = await createOauthState();
  const url = new URL("https://discord.com/oauth2/authorize");

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", getRequiredEnv("DISCORD_CLIENT_ID"));
  url.searchParams.set("redirect_uri", getDiscordRedirectUri(request));
  url.searchParams.set("scope", "identify");
  url.searchParams.set("state", state);

  return NextResponse.redirect(url);
}
