"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sun, Moon, LogOut } from "lucide-react";
import { sidebarItems } from "./sidebarItems";
import useThemeStore from "@/store/useThemeStore";
import { useFirebaseAuthStore } from "@/store/useFirebaseAuthStore";

const Sidebar = () => {
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
      className="flex w-72 flex-col border-r p-4"
      style={{
        background: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
      }}
    >
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
        className="mt-4 rounded-lg border-2 px-2 py-3 text-center font-serif text-2xl font-extrabold"
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

      {/* Navigation - flex-1 to push buttons to bottom */}
      <nav className="mt-6 flex-1 space-y-2 overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.route ||
            (item.route !== "/dashboard" && pathname.startsWith(item.route + "/"));

          return (
            <Link
              key={item.route}
              href={item.route}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                isActive
                  ? "font-bold"
                  : ""
              }`}
              style={{
                background: isActive ? "var(--sidebar-active-bg)" : "transparent",
                color: isActive ? "var(--sidebar-active-text)" : "var(--sidebar-text)",
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
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section - theme toggle + logout */}
      <div className="space-y-2 pt-4" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <button
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all"
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
          {mounted ? (isDark ? <Sun size={20} /> : <Moon size={20} />) : <div className="size-5" />}
          <span>{mounted ? (isDark ? "Light Mode" : "Dark Mode") : ""}</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all"
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
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
