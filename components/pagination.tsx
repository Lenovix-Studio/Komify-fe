"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  siblingCount?: number;
  className?: string;
}

export function PaginationControl({
  currentPage,
  totalPages,
  onPageChange,
  hasNext = currentPage < totalPages,
  hasPrev = currentPage > 1,
  siblingCount = 1,
  className,
}: PaginationControlProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];
    const startPage = Math.max(2, currentPage - siblingCount);
    const endPage = Math.min(totalPages - 1, currentPage + siblingCount);

    pages.push(1);

    if (startPage > 2) {
      pages.push("ellipsis-start");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages - 1) {
      pages.push("ellipsis-end");
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("flex items-center justify-center gap-1.5", className)}
    >
      <Button
        variant="outline"
        size="icon"
        disabled={!hasPrev}
        onClick={() => onPageChange(1)}
        className="h-9 w-9 rounded-xl border-border/80 bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground disabled:bg-transparent disabled:opacity-40"
        title="First Page"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="default"
        disabled={!hasPrev}
        onClick={() => onPageChange(currentPage - 1)}
        className="gap-1 rounded-xl border-border/80 bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground disabled:bg-transparent disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Prev</span>
      </Button>

      <div className="flex items-center gap-1.5">
        {pages.map((item, index) => {
          if (item === "ellipsis-start" || item === "ellipsis-end") {
            return (
              <div
                key={`${item}-${index}`}
                className="flex h-9 w-9 items-center justify-center text-muted-foreground/70"
              >
                <MoreHorizontal className="h-4 w-4" />
              </div>
            );
          }

          const isCurrent = currentPage === item;

          return (
            <Button
              key={item}
              variant={isCurrent ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange(item)}
              className={cn(
                "h-9 w-9 rounded-xl text-sm font-medium transition-all",
                isCurrent
                  ? "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                  : "border-border/80 bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {item}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="default"
        disabled={!hasNext}
        onClick={() => onPageChange(currentPage + 1)}
        className="gap-1 rounded-xl border-border/80 bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground disabled:bg-transparent disabled:opacity-40"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        disabled={!hasNext}
        onClick={() => onPageChange(totalPages)}
        className="h-9 w-9 rounded-xl border-border/80 bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground disabled:bg-transparent disabled:opacity-40"
        title="Last Page"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
