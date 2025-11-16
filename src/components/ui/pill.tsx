import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type PillVariant = "default" | "active";

interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PillVariant;
}

/**
 * Filter pill built as a button so it can toggle active filters via keyboard.
 */
export function Pill({
  className,
  variant = "default",
  ...props
}: PillProps) {
  const styles =
    variant === "active"
      ? "bg-brand-600 text-white"
      : "bg-white text-slate-700 border border-slate-200 hover:border-brand-200";

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
        styles,
        className
      )}
      {...props}
    />
  );
}
