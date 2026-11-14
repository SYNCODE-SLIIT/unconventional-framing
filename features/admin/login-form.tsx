"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Sign in failed.");
      }
      router.replace("/admin");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed.");
      setLoading(false);
    }
  };

  const inputClass =
    "h-12 w-full rounded-lg border border-white/15 bg-zinc-900 px-4 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-white focus:ring-2 focus:ring-white/25";

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#050505] px-5 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.06),transparent_55%)]" />
      <form onSubmit={submit} className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950/80 p-8 shadow-2xl">
        <div className="grid size-12 place-items-center rounded-full bg-white/15 text-zinc-300">
          <Lock size={20} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Admin sign in</h1>
        <p className="mt-1 text-sm text-zinc-400">Research dashboard access only.</p>

        <div className="mt-7 space-y-4">
          <div>
            <label htmlFor="admin-username" className="mb-2 block text-sm font-medium text-zinc-200">
              Username
            </label>
            <input
              id="admin-username"
              className={inputClass}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-zinc-200">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              className={inputClass}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 h-12 w-full rounded-full bg-white font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <Link href="/" className="mt-5 block text-center text-sm text-zinc-500 transition hover:text-white">
          ← Back to the study
        </Link>
      </form>
    </main>
  );
}
