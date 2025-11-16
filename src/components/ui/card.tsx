import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
}

const paddingMap: Record<NonNullable<CardProps["padding"]>, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

/**
 * Glassy card wrapper used throughout the directory.
 * Centralizing it keeps border, radius, and padding consistent.
 */
export function Card({
  className,
  padding = "md",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/40 bg-white/80 shadow-soft-card backdrop-blur",
        paddingMap[padding],
        className
      )}
      {...props}
    />
  );
}
