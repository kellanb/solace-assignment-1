import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "subtle" | "outline" | "brand";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  subtle: "bg-slate-100 text-slate-700",
  outline: "border border-slate-200 text-slate-700",
  brand: "bg-brand-50 text-brand-700",
};

/**
 * Lightweight badge/pill used for specialties, filters, and highlights.
 * Keeps typography + rounded sizing consistent wherever metadata appears.
 */
export function Badge({
  className,
  variant = "subtle",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
