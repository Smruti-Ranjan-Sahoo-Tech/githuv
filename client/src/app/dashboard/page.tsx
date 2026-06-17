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
import Link from "next/link";
import { useEffect } from "react";


export default function Page() {
  const { user, githubAccessToken, loading, initialLoginCheck, logout } =
    useFirebaseAuthStore();

  useEffect(() => {
    const unsubscribe = initialLoginCheck();
    return unsubscribe;
  }, []);

  useEffect(() => {
    console.log("User data:", user);
    console.log("token:",githubAccessToken)
  }, [user, githubAccessToken]);

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
    <div className="border border-zinc-800 rounded-2xl p-6 min-h-[90vh]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* User Info Section */}
      <div className="border border-zinc-800 rounded-xl p-5 mb-8 bg-zinc-900">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <div className="space-y-2">
          <p><span className="text-gray-400">Email:</span> {user.email}</p>
          <p><span className="text-gray-400">Display Name:</span> {user.displayName || "N/A"}</p>
          <p><span className="text-gray-400">UID:</span> {user.uid}</p>
          {githubAccessToken && (
            <p><span className="text-gray-400">GitHub Token:</span> {githubAccessToken.substring(0, 10)}...{githubAccessToken.substring(githubAccessToken.length - 10)}</p>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="border border-zinc-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold">Total Users</h3>
          <p className="text-3xl font-bold mt-2">1,245</p>
        </div>

        <div className="border border-zinc-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold">Repositories</h3>
          <p className="text-3xl font-bold mt-2">328</p>
        </div>

        <div className="border border-zinc-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold">Active Projects</h3>
          <p className="text-3xl font-bold mt-2">57</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Profile Studio</h3>
            <p className="mt-1 text-sm text-white/70">
              Build your profile step by step, save progress automatically, and track completion in one place.
            </p>
          </div>
          <Link
            href="/dashboard/profile-studio"
            className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-white/90"
          >
            Open Profile Studio
          </Link>
        </div>
      </div>
    </div>
  );
}
