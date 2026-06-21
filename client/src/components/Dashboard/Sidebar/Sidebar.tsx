"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sun, Moon, LogOut, X } from "lucide-react";
import { sidebarItems } from "./sidebarItems";
import useThemeStore from "@/store/useThemeStore";
import { useFirebaseAuthStore } from "@/store/useFirebaseAuthStore";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggle } = useThemeStore();
  const logout = useFirebaseAuthStore((s) => s.logout);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside
      className={`glass-strong flex w-72 flex-col border-r p-6 transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-50 md:static md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{
        borderColor: "var(--sidebar-border)",
      }}
    >
      {/* Mobile close button */}
      <button
        className="mb-2 self-end rounded-lg p-1.5 md:hidden transition-colors"
        style={{ color: "var(--sidebar-text)" }}
        onClick={onClose}
      >
        <X size={20} />
      </button>

      {/* Logo */}
      <div className="rounded-3xl border-4 p-3" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="relative p-5 pr-7">
          <span
            className="text-3xl font-black italic tracking-tight"
            style={{ color: "var(--sidebar-text)" }}
          >
            Githu
            <span style={{ color: "var(--accent)" }}>V</span>
          </span>

          <div className="absolute right-1 top-1 animate-pulse rounded-lg bg-yellow-300 px-2 py-1 text-[10px] font-bold text-green-900">
            Admin
          </div>
        </div>
      </div>

      {/* Dashboard Title */}
      <div
        className="mt-6 rounded-lg border-2 px-2 py-3 text-center font-serif text-2xl font-extrabold"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        {"Dashboard".split("").map((char, index) => (
          <span
            key={index}
            className={(index + 1) % 2 === 0 ? "animate-pulse" : ""}
            style={{ color: "var(--sidebar-text)" }}
          >
            {char}{" "}
          </span>
        ))}
      </div>

      {/* Navigation */}
      <nav className="mt-8 flex-1 space-y-1 overflow-y-auto px-0">
        {(() => {
          let lastSection: string | null = null;
          return sidebarItems.map((item: any) => {
            if (item.name === "divider") {
              lastSection = null;
              return (
                <div
                  key="special-divider"
                  className="relative my-4"
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full" style={{ borderTop: "1px solid var(--border-subtle)" }} />
                  </div>
                </div>
              );
            }

            const sectionHeader = item.section && item.section !== lastSection;
            if (item.section) lastSection = item.section;

            const Icon = item.icon;
            const isActive =
              pathname === item.route ||
              (item.route !== "/dashboard" &&
                pathname.startsWith(item.route + "/"));

            return (
              <div key={item.route}>
                {sectionHeader && (
                  <div className="px-4 pt-4 pb-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.2em] text-gradient"
                    >
                      {item.section}
                    </span>
                  </div>
                )}
                <Link
                  href={item.route}
                  className={`group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 ${
                    isActive ? "sidebar-item-active font-semibold" : ""
                  }`}
                  style={{
                    background: isActive
                      ? "var(--sidebar-active-bg)"
                      : "transparent",
                    color: isActive
                      ? "var(--sidebar-active-text)"
                      : "var(--sidebar-text)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "var(--sidebar-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <Icon
                    size={18}
                    className={`transition-transform duration-200 ${
                      isActive ? "scale-110" : "group-hover:scale-110"
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              </div>
            );
          });
        })()}
      </nav>

      {/* Bottom section */}
      <div className="space-y-1.5 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <button
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 group"
          style={{
            color: "var(--sidebar-text)",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--sidebar-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          {mounted ? (
            <span className={`transition-transform duration-200 group-hover:scale-110 ${isDark ? "" : ""}`}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </span>
          ) : (
            <div className="size-[18px]" />
          )}
          <span>{mounted ? (isDark ? "Light Mode" : "Dark Mode") : ""}</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 group"
          style={{
            color: "var(--accent)",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accent-soft)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <LogOut size={18} className="transition-transform duration-200 group-hover:scale-110" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
