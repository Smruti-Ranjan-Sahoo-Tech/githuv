"use client";

import { useFirebaseAuthStore } from "@/store/useFirebaseAuthStore";
import { useGithubDataStore } from "@/store/useGithubDataStore";
import Link from "next/link";
import { useEffect } from "react";
import {
  FaGithub,
  FaStar,
  FaCodeBranch,
  FaBook,
  FaUserFriends,
  FaCode,
  FaExternalLinkAlt,
  FaMapMarkerAlt,
  FaTwitter,
  FaBuilding,
  FaRocket,
  FaLightbulb,
  FaMagic,
} from "react-icons/fa";


export default function Page() {
  const { user, loading, initialLoginCheck } =
    useFirebaseAuthStore();
  const { data, loading: ghLoading, error, fetchDashboardData } = useGithubDataStore();

  useEffect(() => {
    const unsubscribe = initialLoginCheck();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center rounded-2xl p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="shimmer size-16 rounded-full" />
          <div className="shimmer h-4 w-48 rounded-full" />
          <div className="shimmer h-3 w-32 rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center rounded-2xl p-12">
        <p style={{ color: "var(--text-secondary)" }}>Please log in to see the dashboard</p>
      </div>
    );
  }

  const quickLinks = [
    {
      href: "/dashboard/strike-recovery",
      label: "Strike Recovery",
      desc: "Recover your GitHub contribution streak",
      icon: FaRocket,
      gradient: "from-orange-500 to-red-500",
    },
    {
      href: "/dashboard/profile-studio",
      label: "Profile Studio",
      desc: "Build and optimize your developer profile",
      icon: FaMagic,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      href: "/dashboard/readme-intelligence",
      label: "README Intelligence",
      desc: "Build, preview, and publish AI READMEs",
      icon: FaLightbulb,
      gradient: "from-blue-500 to-cyan-500",
    },
  ];

  const statCards = data ? [
    { label: "Repositories", value: data.stats.totalRepos, icon: FaBook },
    { label: "Stars", value: data.stats.totalStars, icon: FaStar },
    { label: "Forks", value: data.stats.totalForks, icon: FaCodeBranch },
    { label: "Followers", value: data.profile.followers, icon: FaUserFriends },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Welcome back, {data?.profile?.name || user?.displayName || "Developer"}
          </p>
        </div>
      </div>

      {ghLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <FaGithub className="text-5xl" style={{ color: "var(--accent)" }} />
            <div className="shimmer h-4 w-48 rounded-full" />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border p-5 card-hover-glow" style={{ borderColor: "var(--accent-border)", background: "var(--accent-soft)" }}>
          <p className="text-sm" style={{ color: "var(--accent-text)" }}>Failed to load GitHub data: {error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Retry
          </button>
        </div>
      )}

      {data && (
        <>
          {/* Profile Card */}
          <div className="glass-border rounded-2xl p-6 card-hover-glow" style={{ background: "var(--surface-card)" }}>
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="relative shrink-0">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-red-500 to-rose-400 opacity-60 blur-md" />
                <img
                  src={data.profile.avatar_url}
                  alt={data.profile.login}
                  className="relative size-20 rounded-full border-2"
                  style={{ borderColor: "var(--border-subtle)" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">{data.profile.name || data.profile.login}</h2>
                  <a
                    href={`https://github.com/${data.profile.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-medium transition-colors"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                  >
                    @{data.profile.login} <FaExternalLinkAlt size={8} />
                  </a>
                </div>
                {data.profile.bio && (
                  <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                    {data.profile.bio}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
                  {data.profile.company && (
                    <span className="inline-flex items-center gap-1.5">
                      <FaBuilding size={11} /> {data.profile.company}
                    </span>
                  )}
                  {data.profile.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <FaMapMarkerAlt size={11} /> {data.profile.location}
                    </span>
                  )}
                  {data.profile.twitter_username && (
                    <a
                      href={`https://twitter.com/${data.profile.twitter_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:underline"
                      style={{ color: "var(--accent)" }}
                    >
                      <FaTwitter size={11} /> @{data.profile.twitter_username}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map((stat, idx) => (
              <div key={stat.label} className="stat-card" style={{ animationDelay: `${idx * 0.08}s` }}>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="flex size-8 items-center justify-center rounded-lg"
                    style={{ background: "var(--accent-soft)" }}
                  >
                    <stat.icon size={14} style={{ color: "var(--accent)" }} />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                    {stat.label}
                  </span>
                </div>
                <p className="text-3xl font-black tabular-nums">{stat.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Main grid: Languages + Recent Repos */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Top Languages */}
            <div className="glass-border rounded-2xl p-5 card-hover-glow" style={{ background: "var(--surface-card)" }}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <FaCode size={14} style={{ color: "var(--accent)" }} />
                Top Languages
              </h3>
              <div className="space-y-3">
                {data.stats.topLanguages.map((lang) => (
                  <div key={lang.language} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{lang.language}</span>
                    <span className="text-xs rounded-full px-2.5 py-0.5" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                      {lang.count} {lang.count === 1 ? "repo" : "repos"}
                    </span>
                  </div>
                ))}
                {data.stats.topLanguages.length === 0 && (
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No languages detected</p>
                )}
              </div>
            </div>

            {/* Recent Repos */}
            <div className="glass-border rounded-2xl p-5 card-hover-glow" style={{ background: "var(--surface-card)" }}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <FaBook size={14} style={{ color: "var(--accent)" }} />
                Recent Repositories
              </h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {data.recentRepos.map((repo) => (
                  <a
                    key={repo.full_name}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-xl p-3 transition-all duration-200"
                    style={{ color: "var(--text-primary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--surface-elevated)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate group-hover:text-accent transition-colors">
                        {repo.name}
                        {repo.private && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                            private
                          </span>
                        )}
                      </p>
                      {repo.language && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{repo.language}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-2 text-xs shrink-0" style={{ color: "var(--text-tertiary)" }}>
                      <span className="inline-flex items-center gap-1">
                        <FaStar size={10} className="transition-transform group-hover:scale-125" /> {repo.stars}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FaCodeBranch size={10} className="transition-transform group-hover:scale-125" /> {repo.forks}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-border rounded-2xl p-5 card-hover-glow" style={{ background: "var(--surface-card)" }}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <FaGithub size={14} style={{ color: "var(--accent)" }} />
              Recent Activity
            </h3>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {data.recentActivity.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded-xl p-2.5 text-sm transition-colors hover:bg-white/5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span className="shrink-0 text-xs font-mono rounded-md px-2 py-1" style={{ background: "var(--surface-elevated)", color: "var(--text-tertiary)" }}>
                    {new Date(event.created_at).toLocaleDateString()}
                  </span>
                  <span className="truncate font-medium">
                    {event.type.replace("Event", "").replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="truncate text-xs shrink-0" style={{ color: "var(--text-tertiary)" }}>
                    {event.repo}
                  </span>
                </div>
              ))}
              {data.recentActivity.length === 0 && (
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No recent activity</p>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid sm:grid-cols-3 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group stat-card flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${link.gradient} text-white transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon size={18} />
                    </div>
                    <h3 className="font-semibold text-sm">{link.label}</h3>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {link.desc}
                  </p>
                  <div className="mt-auto pt-3">
                    <span className="inline-flex items-center gap-1 text-xs font-medium transition-all duration-200 group-hover:gap-2" style={{ color: "var(--accent)" }}>
                      Explore <span className="text-lg leading-none">→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
