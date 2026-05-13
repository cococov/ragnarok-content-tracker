import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { clearSessionCookie, deleteSession, SESSION_COOKIE } from "@/lib/auth";
import { getAppBaseUrl } from "@/lib/url";

export async function POST(request: Request) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  await clearSessionCookie();
  return NextResponse.redirect(getAppBaseUrl(request));
}
