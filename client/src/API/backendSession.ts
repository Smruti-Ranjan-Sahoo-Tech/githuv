import { auth } from "@/config/firebase";

let ensuredForUid: string | null = null;
let inFlight: Promise<boolean> | null = null;

export function resetBackendSession() {
  ensuredForUid = null;
  inFlight = null;
}

export function ensureBackendSession(): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  const user = auth.currentUser;
  if (!user) {
    return Promise.resolve(false);
  }

  if (ensuredForUid === user.uid) {
    return Promise.resolve(true);
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = (async () => {
    try {
      const accessToken = await user.getIdToken();
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ accessToken }),
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) {
        ensuredForUid = user.uid;
      }

      return response.ok;
    } catch {
      return false;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
