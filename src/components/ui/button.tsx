import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
}

const VARIANTS: Record<string, string> = {
  primary:
    "bg-accent-blue text-white hover:bg-accent-blue/90 focus-visible:outline-accent-blue disabled:opacity-60",
  secondary:
    "bg-transparent border border-border-subtle text-primary hover:bg-surface-elevated focus-visible:outline-accent-blue",
  ghost: "bg-transparent text-secondary hover:text-primary hover:bg-surface-elevated",
  danger: "bg-severity-critical text-white hover:bg-severity-critical/90",
};

const SIZES: Record<string, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium",
        "transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
);

Button.displayName = "Button";
