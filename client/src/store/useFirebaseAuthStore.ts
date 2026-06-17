import type { User } from "firebase/auth";
import {
  GithubAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { create } from "zustand";
import { auth, githubProvider } from "@/config/firebase";

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

export const useFirebaseAuthStore = create<FirebaseAuthState>((set) => ({
  user: null,
  githubAccessToken:
    typeof window !== "undefined"
      ? sessionStorage.getItem(githubAccessTokenKey)
      : null,
  loading: true,
  error: null,

  initialLoginCheck: () => {
    set({ loading: true, error: null });

    return onAuthStateChanged(
      auth,
      (user) => {
        const token =
          typeof window !== "undefined"
            ? sessionStorage.getItem(githubAccessTokenKey)
            : null;

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
  },

  loginByGithub: async () => {
    set({
      loading: true,
      error: null,
    });

    try {
      // Clear any stale token first
      sessionStorage.removeItem(githubAccessTokenKey);

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
