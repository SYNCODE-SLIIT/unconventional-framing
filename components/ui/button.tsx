import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        "hover:scale-[1.02] active:scale-[0.99]",
        variant === "primary" &&
          "bg-white text-black shadow-[0_0_32px_rgba(255,255,255,0.25)] hover:bg-zinc-200",
        variant === "ghost" && "bg-white/5 text-white hover:bg-white/10",
        variant === "outline" &&
          "border border-white/15 bg-black/20 text-white hover:border-white/70 hover:bg-white/10",
        className
      )}
      {...props}
    />
  );
}
