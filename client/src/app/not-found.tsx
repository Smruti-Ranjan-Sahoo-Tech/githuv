import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4">
      <div className="relative">
        <h1 className="text-[12rem] font-black leading-none tracking-tighter sm:text-[16rem]">
          <span className="bg-gradient-to-r from-red-500 to-rose-400 bg-clip-text text-transparent">
            404
          </span>
        </h1>
        <div className="absolute right-0 top-0 h-4 w-4 animate-ping rounded-full bg-red-500" />
      </div>
      <p className="mt-4 text-center text-lg text-white/55 sm:text-xl">
        This page does not exist — or maybe it never committed.
      </p>
      <div className="mt-2 h-1 w-32 rounded-full bg-white/10" />
      <Link
        href="/dashboard"
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-rose-400 px-6 py-3 text-sm font-bold text-white transition hover:from-red-400 hover:to-rose-300"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
