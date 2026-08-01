import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-secondary">
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-[15px] font-medium text-primary">{title}</p>
        {description && <p className="mt-1 text-sm text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}
