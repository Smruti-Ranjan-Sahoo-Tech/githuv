"use client";

import { useEffect } from "react";
import { FaGithub } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useFirebaseAuthStore } from "@/store/useFirebaseAuthStore";

const Login = () => {
  const router = useRouter();
  const { error, initialLoginCheck, loading, loginByGithub, user } =
    useFirebaseAuthStore();

  useEffect(() => {
    const unsubscribe = initialLoginCheck();
    return unsubscribe;
  }, [initialLoginCheck]);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [router, user]);

  const handleLogin = async () => {
    const success = await loginByGithub();

    if (success) {
      router.replace("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900 p-8 shadow-2xl shadow-black/30">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">
            GitHub Contribution Hub
          </h1>

          <p className="mt-3 text-slate-400">
            Sign in with GitHub and start contributing to projects.
          </p>
        </div>

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
          Secure authentication powered by GitHub.
        </p>
      </div>
    </div>
  );
};

export default Login;
