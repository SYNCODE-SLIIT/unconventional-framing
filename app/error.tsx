"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-6 text-center text-white">
      <div className="max-w-sm">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          We couldn&apos;t load this page right now. Please try again in a moment.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 h-11 rounded-full bg-white px-6 text-sm font-medium text-black transition hover:bg-zinc-200"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
