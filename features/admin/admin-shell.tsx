"use client";

import { ExternalLink, Film, LayoutDashboard, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/features/admin/logout-button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, match: (path: string) => path === "/admin" || path.startsWith("/admin/participants") },
  { href: "/admin/frames", label: "Frames", icon: Film, match: (path: string) => path.startsWith("/admin/frames") },
  { href: "/admin/scale", label: "Rating scale", icon: SlidersHorizontal, match: (path: string) => path.startsWith("/admin/scale") }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const nav = (
    <nav className="flex gap-1 lg:flex-col" aria-label="Admin">
      {links.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition",
              active ? "bg-white text-black" : "text-zinc-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon size={17} /> {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="border-b border-white/10 bg-black/40 px-4 py-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
        <div className="flex items-center justify-between lg:block">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Admin</p>
            <p className="mt-1 text-sm font-semibold tracking-wide">Unconventional Framing</p>
          </div>
          <div className="lg:hidden">
            <LogoutButton />
          </div>
        </div>

        <div className="mt-4 lg:mt-8">{nav}</div>

        <div className="mt-auto hidden space-y-2 lg:block">
          <Link
            href="/"
            target="_blank"
            className="inline-flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            <ExternalLink size={17} /> View study site
          </Link>
          <LogoutButton />
        </div>
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
