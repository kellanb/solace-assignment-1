import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const baseStyles =
  "block w-full rounded-xl border bg-white px-4 py-2.5 text-base text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-brand-200";

/**
 * Input primitive with baked-in spacing + focus states.
 * `hasError` toggles the border color so validation messaging stays consistent.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          baseStyles,
          hasError
            ? "border-rose-400 focus:ring-rose-200"
            : "border-slate-200 focus:border-brand-500",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
