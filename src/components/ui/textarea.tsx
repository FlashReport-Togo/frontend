import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const fieldId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-sm font-medium text-primary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          className={cn(
            "w-full rounded-lg border border-border-subtle bg-surface-elevated px-3.5 py-2.5 text-[15px]",
            "text-primary placeholder:text-secondary/70 transition-colors resize-none",
            "focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25",
            error && "border-severity-critical",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-severity-critical">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
