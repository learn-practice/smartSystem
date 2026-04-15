'use client';

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export const Pagination = ({ page, total, limit, onChange }: PaginationProps) => {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-2 justify-end mt-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 text-sm rounded border disabled:opacity-40 hover:bg-gray-50"
      >
        Prev
      </button>
      <span className="text-sm text-gray-600">{page} / {totalPages}</span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-sm rounded border disabled:opacity-40 hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  );
};
