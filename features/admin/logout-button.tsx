"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={() => void logout()}
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/5 px-5 text-sm text-zinc-200 transition hover:bg-white/10"
    >
      <LogOut size={16} /> Sign out
    </button>
  );
}
