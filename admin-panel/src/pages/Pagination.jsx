import React from "react";

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  pageSize,
  showingCount,
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4">
      <div className="text-sm text-muted-foreground">
        {showingCount !== false && (
          <>
            Showing {start}-{end} of {total}
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1 rounded border border-border bg-background text-foreground disabled:opacity-50"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          Previous
        </button>
        <span className="text-sm">
          Page {page} of {totalPages}
        </span>
        <button
          className="px-3 py-1 rounded border border-border bg-background text-foreground disabled:opacity-50"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
}
