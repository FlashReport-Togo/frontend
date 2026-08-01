import { forwardRef, type ReactNode, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, className, children, ...props }, ref) => {
    const fieldId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-sm font-medium text-primary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={fieldId}
            className={cn(
              "w-full appearance-none rounded-lg border border-border-subtle bg-surface-elevated px-3.5 py-2.5 pr-10 text-[15px]",
              "text-primary transition-colors focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25",
              error && "border-severity-critical",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary"
          />
        </div>
        {error && <p className="text-sm text-severity-critical">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
