"use client";

import { useState } from "react";
import Sidebar from "@/components/Dashboard/Sidebar/Sidebar";
import ThemeProvider from "@/components/ThemeProvider";
import { ToastContainer } from "react-toastify";
import { Menu } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--dashboard-bg)', color: 'var(--foreground)' }}>
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header
            className="flex items-center justify-between border-b px-4 py-3 md:hidden sticky top-0 z-20"
            style={{
              background: "var(--dashboard-bg)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <span className="text-lg font-black italic tracking-tight" style={{ color: "var(--foreground)" }}>
              Githu<span style={{ color: "var(--accent)" }}>V</span>
            </span>
            <button
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
              style={{
                background: "var(--sidebar-hover)",
                color: "var(--foreground)",
              }}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
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
