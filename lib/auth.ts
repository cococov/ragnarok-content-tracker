import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { query } from "./db";

export const SESSION_COOKIE = "rct_session";
const OAUTH_STATE_COOKIE = "rct_discord_state";
const SESSION_DAYS = 30;

export type CurrentUser = {
  id: string;
  discordId: string;
  discordUsername: string;
  discordAvatar: string | null;
  displayName: string;
};

type UserRow = {
  id: string;
  discord_id: string;
  discord_username: string;
  discord_avatar: string | null;
  display_name: string;
};

type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await query<UserRow>(
    `select u.id, u.discord_id, u.discord_username, u.discord_avatar, u.display_name
       from user_sessions s
       join app_users u on u.id = s.user_id
      where s.token_hash = $1
        and s.expires_at > now()
      limit 1`,
    [hashToken(token)],
  );

  return rows[0] ? mapUser(rows[0]) : null;
}

export async function upsertDiscordUser(input: DiscordUser): Promise<CurrentUser> {
  const displayName = input.global_name || input.username;
  const avatarUrl = input.avatar
    ? `https://cdn.discordapp.com/avatars/${input.id}/${input.avatar}.png`
    : null;

  const rows = await query<UserRow>(
    `insert into app_users (
        discord_id, discord_username, discord_avatar, display_name, updated_at
      )
      values ($1, $2, $3, $4, now())
      on conflict (discord_id) do update
        set discord_username = excluded.discord_username,
            discord_avatar = excluded.discord_avatar,
            updated_at = now()
      returning id, discord_id, discord_username, discord_avatar, display_name`,
    [input.id, input.username, avatarUrl, displayName],
  );

  return mapUser(rows[0]);
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await query(
    `insert into user_sessions (user_id, token_hash, expires_at)
     values ($1, $2, $3)`,
    [userId, hashToken(token), expiresAt],
  );

  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await query("delete from user_sessions where token_hash = $1", [hashToken(token)]);
}

export async function createOauthState(): Promise<string> {
  const state = randomBytes(24).toString("base64url");

  (await cookies()).set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });

  return state;
}

export async function verifyOauthState(state: string | null): Promise<boolean> {
  const store = await cookies();
  const expected = store.get(OAUTH_STATE_COOKIE)?.value;
  store.delete(OAUTH_STATE_COOKIE);

  if (!state || !expected) return false;

  const a = Buffer.from(state);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setSessionCookie(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function mapUser(row: UserRow): CurrentUser {
  return {
    id: row.id,
    discordId: row.discord_id,
    discordUsername: row.discord_username,
    discordAvatar: row.discord_avatar,
    displayName: row.display_name,
  };
}
