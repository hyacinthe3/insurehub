import { cookies } from "next/headers";

import { API_URL, type SessionState } from "./api";

export const SESSION_COOKIE = "ih_session";

/**
 * Server-side session check for protected layouts/pages. Forwards the
 * browser's httpOnly session cookie to the backend and returns its verdict —
 * the backend remains the single source of truth for auth + MFA state.
 */
export async function getServerSession(): Promise<SessionState> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return { authenticated: false, mfaPending: false, user: null };
  }

  try {
    const res = await fetch(`${API_URL}/auth/session`, {
      headers: { cookie: `${SESSION_COOKIE}=${encodeURIComponent(token)}` },
      cache: "no-store",
    });
    if (!res.ok) return { authenticated: false, mfaPending: false, user: null };
    return (await res.json()) as SessionState;
  } catch {
    return { authenticated: false, mfaPending: false, user: null };
  }
}
