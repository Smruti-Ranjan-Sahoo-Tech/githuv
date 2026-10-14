import type { User } from "firebase/auth";
import {
  GithubAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { create } from "zustand";
import { auth, githubProvider } from "@/config/firebase";
import { ensureBackendSession, resetBackendSession } from "@/API/backendSession";

const githubAccessTokenKey = "githubAccessToken";

type FirebaseAuthState = {
  user: User | null;
  githubAccessToken: string | null;
  loading: boolean;
  error: string | null;

  initialLoginCheck: () => () => void;
  loginByGithub: () => Promise<boolean>;
  logout: () => Promise<boolean>;
};

const getErrorMessage = (error: unknown) => {
  return error instanceof Error
    ? error.message
    : "Something went wrong.";
};

let authListenerCount = 0;
let authUnsubscribe: (() => void) | null = null;

export const useFirebaseAuthStore = create<FirebaseAuthState>((set, get) => ({
  user: null,
  githubAccessToken:
    typeof window !== "undefined"
      ? sessionStorage.getItem(githubAccessTokenKey)
      : null,
  loading: true,
  error: null,

  initialLoginCheck: () => {
    authListenerCount += 1;

    if (!authUnsubscribe) {
      if (!get().user) {
        set({ loading: true, error: null });
      }

      authUnsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          const token =
            typeof window !== "undefined"
              ? sessionStorage.getItem(githubAccessTokenKey)
              : null;

          const alreadyResolved = get().user?.uid === user?.uid;

          if (user && !alreadyResolved) {
            set({ loading: true, error: null });
            await ensureBackendSession();
          }

          set({
            user,
            githubAccessToken: token,
            loading: false,
            error: null,
          });
        },
        (error) => {
          set({
            user: null,
            githubAccessToken: null,
            loading: false,
            error: getErrorMessage(error),
          });
        },
      );
    }

    let active = true;

    return () => {
      if (!active) return;
      active = false;

      authListenerCount -= 1;

      if (authListenerCount <= 0) {
        authListenerCount = 0;
        authUnsubscribe?.();
        authUnsubscribe = null;
      }
    };
  },

  loginByGithub: async () => {
    set({
      loading: true,
      error: null,
    });

    try {
      // Clear any stale token first
      sessionStorage.removeItem(githubAccessTokenKey);
      resetBackendSession();

      const result = await signInWithPopup(
        auth,
        githubProvider,
      );

      const credential =
        GithubAuthProvider.credentialFromResult(result);

      const githubAccessToken =
        credential?.accessToken ?? null;

      if (!githubAccessToken) {
        throw new Error(
          "GitHub access token was not returned.",
        );
      }

      const firebaseAccessToken = await result.user.getIdToken();

      const backendResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          accessToken: firebaseAccessToken,
          githubAccessToken,
        }),
      });

      if (!backendResponse.ok) {
        const payload = await backendResponse
          .json()
          .catch(() => null) as { message?: string } | null;

        throw new Error(
          payload?.message ?? "Failed to create backend session.",
        );
      }

      sessionStorage.setItem(
        githubAccessTokenKey,
        githubAccessToken,
      );

      set({
        user: result.user,
        githubAccessToken,
        loading: false,
        error: null,
      });

      return true;
    } catch (error) {
      set({
        loading: false,
        error: getErrorMessage(error),
      });

      return false;
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      await signOut(auth);

      resetBackendSession();

      sessionStorage.removeItem(
        githubAccessTokenKey,
      );

      set({
        user: null,
        githubAccessToken: null,
        loading: false,
        error: null,
      });

      return true;
    } catch (error) {
      set({
        loading: false,
        error: getErrorMessage(error),
      });

      return false;
    }
  },
}));
