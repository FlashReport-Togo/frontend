import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  error?: string;
  trailing?: ReactNode;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, icon, error, trailing, id, className, ...props }, ref) => {
    const fieldId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-primary">
          {label}
        </label>
        <div className="relative flex items-center">
          {icon && (
            <span className="pointer-events-none absolute left-3.5 text-secondary">{icon}</span>
          )}
          <input
            ref={ref}
            id={fieldId}
            className={cn(
              "w-full rounded-lg border border-border-subtle bg-surface-elevated px-3.5 py-2.5 text-[15px]",
              "text-primary placeholder:text-secondary/70",
              "transition-colors focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25",
              icon && "pl-11",
              trailing && "pr-11",
              error && "border-severity-critical focus:border-severity-critical focus:ring-severity-critical/20",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            {...props}
          />
          {trailing && <span className="absolute right-3.5">{trailing}</span>}
        </div>
        {error && (
          <p id={`${fieldId}-error`} className="text-sm text-severity-critical">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Field.displayName = "Field";
