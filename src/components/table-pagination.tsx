'use client';

import { Button } from '@/components/ui/button';

type PageItem = number | 'ellipsis';

/**
 * 计算要展示的页码序列，最多 7 个位置，超出用省略号折叠。
 * 例：1 2 3 4 5 … 20 ｜ 1 … 9 10 11 … 20 ｜ 1 … 16 17 18 19 20
 */
function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}

interface TablePaginationProps {
  /** 筛选后的总记录数 */
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({ total, currentPage, pageSize, onPageChange }: TablePaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const items = getPageItems(currentPage, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
      <span className="text-xs text-muted-foreground">共 {total} 条记录</span>
      <div className="flex flex-wrap items-center justify-end gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          上一页
        </Button>
        {items.map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={currentPage === item ? 'default' : 'outline'}
              size="sm"
              className="h-7 w-7 p-0 text-xs"
              onClick={() => onPageChange(item)}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
