"use client";

import { useEffect } from "react";
import { GitBranch, MapPin, Mail, Link as LinkIcon, Users, BookOpen, Star } from "lucide-react";
import { useFirebaseAuthStore } from "@/store/useFirebaseAuthStore";
import { useGithubDataStore } from "@/store/useGithubDataStore";

export default function UserPage() {
  const { user, loading: authLoading, initialLoginCheck } = useFirebaseAuthStore();
  const { data, loading, fetchDashboardData } = useGithubDataStore();

  useEffect(() => {
    const unsub = initialLoginCheck();
    return unsub;
  }, [initialLoginCheck]);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user, fetchDashboardData]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-red-400" />
      </div>
    );
  }

  if (!user) return null;

  const p = data?.profile;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {p?.avatar_url && (
            <img
              src={p.avatar_url}
              alt={p.login}
              className="h-24 w-24 rounded-2xl border border-white/10 object-cover sm:h-28 sm:w-28"
            />
          )}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {p?.name || p?.login || "User"}
            </h1>
            {p?.bio && <p className="mt-2 text-sm leading-6 text-white/55">{p.bio}</p>}
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-white/50 sm:justify-start">
              {p?.login && (
                <a
                  href={`https://github.com/${p.login}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition hover:text-white"
                >
                  <GitBranch size={16} /> {p.login}
                </a>
              )}
              {p?.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={16} /> {p.location}
                </span>
              )}
              {p?.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={16} /> {p.email}
                </span>
              )}
              {p?.blog && (
                <a
                  href={p.blog}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 transition hover:text-white"
                >
                  <LinkIcon size={16} /> {p.blog.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-red-400" />
            <div>
              <p className="text-2xl font-bold text-white">{data?.stats.totalRepos ?? 0}</p>
              <p className="text-sm text-white/50">Repositories</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <Star size={20} className="text-red-400" />
            <div>
              <p className="text-2xl font-bold text-white">{data?.stats.totalStars ?? 0}</p>
              <p className="text-sm text-white/50">Stars earned</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-red-400" />
            <div>
              <p className="text-2xl font-bold text-white">{p?.followers ?? 0}</p>
              <p className="text-sm text-white/50">Followers</p>
            </div>
          </div>
        </div>
      </div>

      {data?.stats.topLanguages && data.stats.topLanguages.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-4 text-sm font-semibold text-white/70">Top Languages</h2>
          <div className="flex flex-wrap gap-2">
            {data.stats.topLanguages.map((lang) => (
              <span
                key={lang.language}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70"
              >
                {lang.language}
                <span className="ml-1.5 text-xs text-white/40">{lang.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
