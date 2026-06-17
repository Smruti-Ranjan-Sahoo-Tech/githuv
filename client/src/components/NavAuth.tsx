"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFirebaseAuthStore } from "@/store/useFirebaseAuthStore";

export default function NavAuth() {
  const { user, loading, initialLoginCheck, logout } = useFirebaseAuthStore();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = initialLoginCheck();
    return unsubscribe;
  }, [initialLoginCheck]);

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      router.push("/");
    }
  };

  if (loading) {
    return (
      <span className="size-5 animate-pulse rounded-full bg-neutral-700" />
    );
  }

  if (user) {
    return (
      <button
        onClick={handleLogout}
        className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
      >
        Logout
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
    >
      Login
    </Link>
  );
}
