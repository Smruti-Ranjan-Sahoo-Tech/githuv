"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Dashboard/Sidebar/Sidebar";
import ThemeProvider from "@/components/ThemeProvider";
import { ToastContainer } from "react-toastify";
import { Menu } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { useFirebaseAuthStore } from "@/store/useFirebaseAuthStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { user, loading, initialLoginCheck } = useFirebaseAuthStore();

  useEffect(() => {
    const unsubscribe = initialLoginCheck();
    return unsubscribe;
  }, [initialLoginCheck]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--dashboard-bg, #0a0a0a)" }}
      >
        <div
          className="h-10 w-10 animate-spin rounded-full border-2"
          style={{ borderColor: "var(--border-subtle, #333)", borderTopColor: "var(--accent, #22c55e)" }}
        />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="dashboard-grid flex h-screen overflow-hidden" style={{ background: 'var(--dashboard-bg)', color: 'var(--foreground)' }}>
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <header
            className="flex items-center justify-between border-b px-4 py-3 md:hidden sticky top-0 z-20 glass-strong"
            style={{
              borderColor: "var(--border-subtle)",
            }}
          >
            <span className="text-lg font-black italic tracking-tight" style={{ color: "var(--foreground)" }}>
              Githu<span style={{ color: "var(--accent)" }}>V</span>
            </span>
            <button
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/10"
              style={{
                color: "var(--foreground)",
              }}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
          </header>
          <main className="relative flex-1 overflow-y-auto p-4 md:p-8 z-10">
            <div className="page-enter">
              {children}
            </div>
          </main>
        </div>
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss={false}
          theme="dark"
        />
      </div>
    </ThemeProvider>
  );
}
