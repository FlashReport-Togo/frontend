"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface p-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "rounded-md px-3.5 py-1.5 text-sm font-medium text-secondary transition-colors",
        "data-[state=active]:bg-surface-elevated data-[state=active]:text-primary data-[state=active]:shadow-sm",
        "hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("mt-5 focus:outline-none", className)} {...props} />;
}
