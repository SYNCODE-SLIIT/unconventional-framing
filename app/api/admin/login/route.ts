import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, SESSION_SECONDS, adminConfigured, checkCredentials, createSessionToken } from "@/lib/admin-session";

const loginSchema = z.object({
  username: z.string().min(1).max(200),
  password: z.string().min(1).max(200)
});

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "Admin login is not configured on the server." }, { status: 503 });
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !checkCredentials(parsed.data.username, parsed.data.password)) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS
  });
  return response;
}
