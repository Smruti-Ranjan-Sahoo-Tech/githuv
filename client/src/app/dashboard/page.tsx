// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useFirebaseAuthStore } from "@/store/useFirebaseAuthStore";

// const DashboardPage = () => {
//   const { user, githubAccessToken, loading, initialLoginCheck, logout } =
//     useFirebaseAuthStore();
//   const router = useRouter();

//   useEffect(() => {
//     const unsubscribe = initialLoginCheck();
//     return unsubscribe;
//   }, [initialLoginCheck]);

//   useEffect(() => {
//     if (user) {
//       console.log("Firebase user:", user);
//     }
//   }, [user]);

//   const handleLogout = async () => {
//     const success = await logout();
//     if (success) {
//       router.push("/login");
//     }
//   };

//   if (loading) {
//     return <div className="p-8">Loading...</div>;
//   }

//   if (!user) {
//     router.push("/login");
//     return null;
//   }

//   return (
//     <div className="p-8 max-w-2xl mx-auto">
//       <div className="flex items-center justify-between mb-6">
//         <h1 className="text-3xl font-bold">Dashboard</h1>
//         <button
//           onClick={handleLogout}
//           className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition"
//         >
//           Logout
//         </button>
//       </div>

//       <div className="bg-gray-100 rounded-lg p-6 mb-6">
//         <h2 className="text-xl font-semibold mb-4">User Information</h2>
//         <div className="space-y-3">
//           <div>
//             <p className="text-gray-600 text-sm">Email</p>
//             <p className="text-lg font-medium">{user.email}</p>
//           </div>
//           <div>
//             <p className="text-gray-600 text-sm">Display Name</p>
//             <p className="text-lg font-medium">{user.displayName || "N/A"}</p>
//           </div>
//         </div>
//       </div>

//       <div className="bg-blue-100 rounded-lg p-6">
//         <h2 className="text-xl font-semibold mb-4">GitHub Access Token</h2>
//         {githubAccessToken ? (
//           <div>
//             <p className="text-gray-600 text-sm mb-2">Token (hidden for security)</p>
//             <p className="text-sm font-mono bg-white p-3 rounded border border-blue-300 break-all">
//               {githubAccessToken.substring(0, 10)}...{githubAccessToken.substring(githubAccessToken.length - 10)}
//             </p>
//             <p className="text-xs text-gray-500 mt-2">Full token length: {githubAccessToken.length} characters</p>
//           </div>
//         ) : (
//           <p className="text-gray-600">No GitHub token available</p>
//         )}
//       </div>
//     </div>
//   )
// };

// export default DashboardPage;
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
  FaUsers,
  FaCode,
  FaExternalLinkAlt,
  FaUserFriends,
  FaMapMarkerAlt,
  FaTwitter,
  FaBuilding,
} from "react-icons/fa";


export default function Page() {
  const { user, loading, initialLoginCheck, logout } =
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
      <div className="border border-zinc-800 rounded-2xl p-6 min-h-[90vh] flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="border border-zinc-800 rounded-2xl p-6 min-h-[90vh] flex items-center justify-center">
        <p className="text-xl">Please log in to see the dashboard</p>
      </div>
    );
  }

  return (
    <div className="border border-zinc-800 rounded-2xl p-4 sm:p-6 min-h-[90vh]">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Developer Dashboard</h1>
        <button
          onClick={logout}
          className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Logout
        </button>
      </div>

      {ghLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <FaGithub className="text-4xl animate-pulse" style={{ color: "var(--accent)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Fetching your GitHub data...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 mb-6">
          <p className="text-sm text-red-200">Failed to load GitHub data: {error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="mt-2 text-sm text-red-300 underline hover:text-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {data && (
        <>
          {/* Profile Card */}
          <div className="rounded-xl border p-5 mb-6" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <img
                src={data.profile.avatar_url}
                alt={data.profile.login}
                className="size-20 rounded-full border-2"
                style={{ borderColor: "var(--border-subtle)" }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">{data.profile.name || data.profile.login}</h2>
                  <a
                    href={`https://github.com/${data.profile.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline inline-flex items-center gap-1"
                    style={{ color: "var(--accent)" }}
                  >
                    @{data.profile.login} <FaExternalLinkAlt size={10} />
                  </a>
                </div>
                {data.profile.bio && (
                  <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                    {data.profile.bio}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
                  {data.profile.company && (
                    <span className="inline-flex items-center gap-1">
                      <FaBuilding size={12} /> {data.profile.company}
                    </span>
                  )}
                  {data.profile.location && (
                    <span className="inline-flex items-center gap-1">
                      <FaMapMarkerAlt size={12} /> {data.profile.location}
                    </span>
                  )}
                  {data.profile.twitter_username && (
                    <a
                      href={`https://twitter.com/${data.profile.twitter_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                      style={{ color: "var(--accent)" }}
                    >
                      <FaTwitter size={12} /> @{data.profile.twitter_username}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
              <div className="flex items-center gap-2 mb-1">
                <FaBook size={14} style={{ color: "var(--accent)" }} />
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Repos</span>
              </div>
              <p className="text-2xl font-bold">{data.stats.totalRepos}</p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
              <div className="flex items-center gap-2 mb-1">
                <FaStar size={14} style={{ color: "var(--accent)" }} />
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Stars</span>
              </div>
              <p className="text-2xl font-bold">{data.stats.totalStars}</p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
              <div className="flex items-center gap-2 mb-1">
                <FaCodeBranch size={14} style={{ color: "var(--accent)" }} />
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Forks</span>
              </div>
              <p className="text-2xl font-bold">{data.stats.totalForks}</p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
              <div className="flex items-center gap-2 mb-1">
                <FaUserFriends size={14} style={{ color: "var(--accent)" }} />
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Followers</span>
              </div>
              <p className="text-2xl font-bold">{data.profile.followers}</p>
            </div>
          </div>

          {/* Top Languages & Recent Repos */}
          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            {/* Top Languages */}
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FaCode size={14} style={{ color: "var(--accent)" }} />
                Top Languages
              </h3>
              <div className="space-y-2">
                {data.stats.topLanguages.map((lang) => (
                  <div key={lang.language} className="flex items-center justify-between">
                    <span className="text-sm">{lang.language}</span>
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
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
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FaBook size={14} style={{ color: "var(--accent)" }} />
                Recent Repositories
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.recentRepos.map((repo) => (
                  <a
                    key={repo.full_name}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg transition-colors hover:bg-white/5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {repo.name}
                        {repo.private && (
                          <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                            private
                          </span>
                        )}
                      </p>
                      {repo.language && (
                        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{repo.language}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                      <span className="inline-flex items-center gap-0.5">
                        <FaStar size={10} /> {repo.stars}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <FaCodeBranch size={10} /> {repo.forks}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border p-4 mb-6" style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FaGithub size={14} style={{ color: "var(--accent)" }} />
              Recent Activity
            </h3>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {data.recentActivity.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-2 rounded-lg text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span className="text-xs font-mono whitespace-nowrap" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(event.created_at).toLocaleDateString()}
                  </span>
                  <span className="truncate">
                    {event.type.replace("Event", "").replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>
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
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/dashboard/strike-recovery"
              className="rounded-xl border p-4 transition-all hover:-translate-y-0.5"
              style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚡</span>
                <h3 className="font-semibold">Strike Recovery</h3>
              </div>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Recover your GitHub contribution streak with auto-generated commits
              </p>
            </Link>
            <Link
              href="/dashboard/profile-studio"
              className="rounded-xl border p-4 transition-all hover:-translate-y-0.5"
              style={{ borderColor: "var(--border-subtle)", background: "var(--dashboard-card-bg)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <FaGithub size={16} style={{ color: "var(--accent)" }} />
                <h3 className="font-semibold">Profile Studio</h3>
              </div>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Build and optimize your developer profile
              </p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
