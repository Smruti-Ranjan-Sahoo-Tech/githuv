"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import NavAuth from "./NavAuth";
import { FaBars, FaTimes } from "react-icons/fa";

const links = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features", isAnchor: true },
  { label: "About", href: "/about" },
  { label: "Terms", href: "/terms" },
  { label: "Developer", href: "/developer" },
];

export default function Navbar({ showAuth = true }: { showAuth?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" aria-label="GithuV home" className="text-2xl font-black italic tracking-tight">
          Githu<span className="text-red-500">V</span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {links.map((link) => {
            if (link.isAnchor) {
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-neutral-300 transition hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </a>
              );
            }
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition hover:bg-white/10 hover:text-white ${
                  active ? "text-red-300" : "text-neutral-300"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {showAuth && <NavAuth />}
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="flex items-center text-neutral-300 transition hover:text-white md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-neutral-950 px-5 pb-5 pt-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => {
              if (link.isAnchor) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-white/10"
                  >
                    {link.label}
                  </a>
                );
              }
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium transition hover:bg-white/10 ${
                    active ? "text-red-300" : "text-neutral-300"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {showAuth && (
              <div className="mt-2 border-t border-white/10 pt-3">
                <NavAuth />
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
