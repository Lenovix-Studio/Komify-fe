"use client";

import Link from "next/link";
import { ArrowLeft, Bookmark, Clock3, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { PaginationControl } from "@/components/pagination";
import { toast } from "sonner";
import { BACKEND_URL } from "@/lib/constant";
import { BookmarkItem } from "@/types/bookmarkPage";

interface BookmarkViewProps {
  initialBookmarks: BookmarkItem[];
}

export function BookmarkView({ initialBookmarks }: BookmarkViewProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(initialBookmarks);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const removeBookmark = async (comicId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/bookmarks/${comicId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete bookmark");
      }

      setBookmarks((prev) => prev.filter((x) => x.comics.id !== comicId));

      toast.success("Bookmark dihapus", {
        description: "Komik telah dihapus dari daftar bookmark Anda.",
      });
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal menghapus bookmark", {
        description: error.message || "Terjadi kesalahan saat menghapus data.",
      });
    }
  };

  const clearAllBookmarks = async () => {
    if (!confirm("Clear all bookmarks?")) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/bookmarks`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed");
      }

      setBookmarks([]);
      toast.success("Semua bookmark dibersihkan");
    } catch (error) {
      console.error(error);
      toast.error("Gagal membersihkan bookmark");
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const filteredBookmarks = bookmarks.filter((item) =>
    item.comics.title.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBookmarks.length / PAGE_SIZE),
  );

  const paginatedBookmarks = filteredBookmarks.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <Header
        logo={false}
        showSearch={false}
        showRandom={false}
        leftContent={
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-1.5 rounded-xl border-border/80 bg-card hover:bg-accent hover:text-foreground shadow-xs"
          >
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </Button>
        }
        centerContent={
          <div className="hidden items-center gap-2 md:flex w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
              <Input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search bookmarks..."
                className="pl-9 pr-8 h-10 rounded-xl bg-card border-border/80 focus-visible:bg-background transition-all text-sm shadow-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        }
        rightContent={
          <Button
            variant="destructive"
            size="sm"
            onClick={clearAllBookmarks}
            disabled={bookmarks.length === 0}
            className="gap-2 rounded-xl shadow-xs text-white"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear All</span>
          </Button>
        }
      />

      <main className="mx-auto max-w-7xl px-6 py-5 overflow-y-auto flex-1 w-full">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {paginatedBookmarks.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <Bookmark className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">
                {search ? "No matching bookmarks found" : "No bookmarks found"}
              </p>
            </div>
          ) : (
            paginatedBookmarks.map((item) => (
              <Link
                key={item.comics.id}
                href={`/comic/${item.comics.seo_slug ?? item.comics.id}`}
                className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-md"
              >
                <div className="aspect-2/3 bg-muted/40 overflow-hidden">
                  {item.comics.cover_path && (
                    <img
                      src={`${BACKEND_URL}${item.comics.cover_path}`}
                      alt={item.comics.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold text-white">
                    {item.comics.title}
                  </h3>

                  <p className="mt-1 flex items-center gap-1 text-xs text-white/80">
                    <Clock3 className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeBookmark(item.comics.id);
                    }}
                    className="rounded-xl bg-destructive/90 p-2 text-destructive-foreground backdrop-blur-xs hover:bg-destructive shadow-xs transition-colors"
                    title="Remove bookmark"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Link>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center pb-6">
            <PaginationControl
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(newPage) => setPage(newPage)}
              hasNext={page < totalPages}
              hasPrev={page > 1}
            />
          </div>
        )}
      </main>
    </div>
  );
}
