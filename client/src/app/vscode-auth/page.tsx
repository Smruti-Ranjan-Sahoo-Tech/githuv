"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FaGithub } from "react-icons/fa";
import type { User } from "firebase/auth";
import {
  GithubAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";
import { auth, githubProvider } from "@/config/firebase";

const DEFAULT_REDIRECT_URI = "vscode://githuv/auth-callback";

function getRedirectUri(): string {
  if (typeof window === "undefined") {
    return DEFAULT_REDIRECT_URI;
  }
  const redirect = new URLSearchParams(window.location.search).get("redirect");
  return redirect || DEFAULT_REDIRECT_URI;
}

async function fetchVSCodeToken(
  firebaseIdToken: string,
  githubAccessToken: string,
): Promise<string> {
  const response = await fetch("/api/auth/vscode-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firebaseIdToken, githubAccessToken }),
  });

  if (!response.ok) {
    throw new Error("The backend could not issue an authenticated token.");
  }

  const data = (await response.json()) as { code?: string };
  if (!data.code) {
    throw new Error("The backend did not return an exchange code.");
  }
  return data.code;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";

const VSCodeAuthPage = () => {
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const launchedRef = useRef(false);
  const pendingGithubTokenRef = useRef<string | null>(null);
  const completingRef = useRef(false);

  const completeAuth = useCallback(
    async (user: User, githubAccessToken: string) => {
      if (completingRef.current) return;
      completingRef.current = true;

      setError(null);
      setRedirecting(true);
      setLoading(true);

      try {
        const firebaseIdToken = await user.getIdToken();

        const code = await fetchVSCodeToken(firebaseIdToken, githubAccessToken);

        const redirect = getRedirectUri();
        const separator = redirect.startsWith("http") ? "?" : "#";
        const url = `${redirect}${separator}code=${encodeURIComponent(code)}`;
        setRedirectUrl(url);

        const onBlur = () => {
          launchedRef.current = true;
        };
        window.addEventListener("blur", onBlur);

        window.location.href = url;

        window.setTimeout(() => {
          window.removeEventListener("blur", onBlur);
          if (!launchedRef.current) {
            setManualOpen(true);
          }
        }, 2500);
      } catch (err) {
        pendingGithubTokenRef.current = null;
        setRedirecting(false);
        setManualOpen(false);
        setLoading(false);
        setError(getErrorMessage(err));
      } finally {
        completingRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && pendingGithubTokenRef.current) {
        void completeAuth(user, pendingGithubTokenRef.current)
          .finally(() => setLoading(false));
        return;
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [completeAuth]);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, githubProvider);

      const credential = GithubAuthProvider.credentialFromResult(result);
      const githubAccessToken = credential?.accessToken ?? null;

      if (!githubAccessToken) {
        throw new Error("GitHub access token was not returned.");
      }

      pendingGithubTokenRef.current = githubAccessToken;

      await completeAuth(result.user, githubAccessToken);
    } catch (err) {
      setLoading(false);
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900 p-8 shadow-2xl shadow-black/30">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">
            Githu<span className="text-3xl text-red-500">V</span>
          </h1>

          <p className="mt-3 text-slate-400">
            Sign in to authorize the VS Code extension. You&apos;ll be returned to
            VS Code automatically.
          </p>
        </div>

        {redirecting ? (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-center gap-3 text-sm text-slate-300">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              {manualOpen ? "Waiting for VS Code..." : "Redirecting to VS Code..."}
            </div>

            {!manualOpen ? (
              <button
                type="button"
                onClick={() => setManualOpen(true)}
                className="w-full rounded-md border border-neutral-700 px-4 py-2 text-sm text-slate-300 transition hover:border-neutral-500 hover:text-white"
              >
                Not opening? Open VS Code manually
              </button>
            ) : null}

            {manualOpen && redirectUrl ? (
              <a
                href={redirectUrl}
                className="block w-full rounded-md bg-white px-4 py-3 text-center font-semibold text-black transition hover:bg-neutral-200"
              >
                Open VS Code
              </a>
            ) : null}

          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-md bg-white px-4 py-3 font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaGithub size={22} />
              {loading ? "Checking session..." : "Continue with GitHub"}
            </button>

            {error ? (
              <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <p className="mt-6 text-center text-sm text-slate-500">
              Used only for the Githuv VS Code webview authentication.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default VSCodeAuthPage;
