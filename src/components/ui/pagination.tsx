import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  count,
  pageSize = 20,
  onPageChange,
}: {
  page: number;
  count: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border-subtle px-5 py-3.5">
      <p className="text-sm text-secondary">
        Page <span className="font-mono text-primary">{page}</span> sur{" "}
        <span className="font-mono text-primary">{totalPages}</span> · {count} résultat(s)
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-secondary hover:text-primary disabled:opacity-40 disabled:hover:text-secondary"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-secondary hover:text-primary disabled:opacity-40 disabled:hover:text-secondary"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
