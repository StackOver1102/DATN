import React from "react";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  currentPageHref?: (page: number) => string;
  siblingCount?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  currentPageHref,
  siblingCount = 1,
}) => {
  // Tạo mảng các trang sẽ hiển thị
  const getPageNumbers = () => {
    const pageNumbers = [];

    // Luôn hiển thị trang 1
    if (currentPage > siblingCount + 2) {
      pageNumbers.push(1);

      // Thêm dấu "..." nếu cần
      if (currentPage > siblingCount + 3) {
        pageNumbers.push("ellipsis");
      }
    }

    // Tính toán trang trước và sau trang hiện tại
    const startPage = Math.max(1, currentPage - siblingCount);
    const endPage = Math.min(totalPages, currentPage + siblingCount);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Luôn hiển thị trang cuối cùng
    if (currentPage < totalPages - siblingCount - 1) {
      // Thêm dấu "..." nếu cần
      if (currentPage < totalPages - siblingCount - 2) {
        pageNumbers.push("ellipsis");
      }

      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  // Nếu chỉ có 1 trang, không hiển thị phân trang
  if (totalPages <= 1) {
    return null;
  }

  // Render paginated buttons or links
  const renderPageItem = (
    page: number,
    label: React.ReactNode,
    disabled = false,
    key?: string | number
  ) => {
    const isActive = currentPage === page;
    const commonClassName = isActive
      ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500"
      : "";

    if (currentPageHref && !disabled) {
      // Preserve existing query parameters in the URL
      return (
        <Link
          key={key}
          href={currentPageHref(page)}
          className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all ${commonClassName} ${
            isActive ? "bg-yellow-400" : "bg-white border border-gray-300"
          } px-4 py-2`}
        >
          {label}
        </Link>
      );
    }

    return (
      <Button
        key={key}
        variant={isActive ? "default" : "outline"}
        className={commonClassName}
        onClick={() => onPageChange && onPageChange(page)}
        disabled={disabled}
      >
        {label}
      </Button>
    );
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      {/* Previous page button */}
      {renderPageItem(
        Math.max(1, currentPage - 1),
        <ChevronLeft className="h-4 w-4" />,
        currentPage === 1,
        "prev"
      )}

      {/* Page numbers */}
      {getPageNumbers().map((page, idx) => {
        if (page === "ellipsis") {
          return (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">
              ...
            </span>
          );
        }

        return renderPageItem(Number(page), page, false, page);
      })}

      {/* Next page button */}
      {renderPageItem(
        Math.min(totalPages, currentPage + 1),
        <ChevronRight className="h-4 w-4" />,
        currentPage === totalPages,
        "next"
      )}
    </div>
  );
};

export default Pagination;
