import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { getDefaultState } from "@/app/tracker/constants";
import type { AppState } from "@/app/tracker/types";

type TrackerStateRow = {
  state_json: AppState;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await query<TrackerStateRow>(
    `select state_json
       from user_tracker_states
      where user_id = $1
      limit 1`,
    [user.id],
  );

  const state = rows[0]?.state_json ?? getDefaultState();
  return NextResponse.json({ state });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const state = (payload as { state?: AppState })?.state;
  if (!state || typeof state !== "object") {
    return NextResponse.json({ error: "Invalid state payload" }, { status: 400 });
  }

  await query(
    `insert into user_tracker_states (user_id, state_json, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (user_id) do update
       set state_json = excluded.state_json,
           updated_at = now()`,
    [user.id, JSON.stringify(state)],
  );

  return NextResponse.json({ ok: true });
}
