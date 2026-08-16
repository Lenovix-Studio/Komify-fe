"use client";

import Link from "next/link";
import { ArrowLeft, Bookmark, Clock3, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";

type BookmarkComic = {
  id: string;
  title: string;
  seo_slug: string | null;
  cover_path: string | null;
  alternative_title: string | null;
  category_id: string | null;
};

type BookmarkItem = {
  comic_id: string;
  created_at: string;
  comics: BookmarkComic;
};

export default function BookmarkPage() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const response = await fetch(`${baseUrl}/bookmarks`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch bookmarks");
        }

        const data = await response.json();
        setBookmarks(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [baseUrl]);

  const removeBookmark = async (comicId: string) => {
    try {
      const response = await fetch(`${baseUrl}/bookmarks/${comicId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete bookmark");
      }

      setBookmarks((prev) => prev.filter((x) => x.comics.id !== comicId));
    } catch (error) {
      console.error(error);
      alert("Failed to remove bookmark");
    }
  };

  const clearAllBookmarks = async () => {
    if (!confirm("Clear all bookmarks?")) {
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/bookmarks`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed");
      }

      setBookmarks([]);
    } catch (error) {
      console.error(error);
      alert("Failed to clear bookmarks");
    }
  };

  // Filter, Search, Sort
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        logo={false}
        showSearch={false}
        showRandom={false}
        leftContent={
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-1.5 rounded-xl border-border/80 bg-background/50 hover:bg-accent"
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
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bookmarks..."
                className="pl-9 pr-8 h-10 rounded-xl bg-muted/50 border-border/60 focus-visible:bg-background transition-all text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
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
            className="gap-2 rounded-xl"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear All</span>
          </Button>
        }
      />

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-5">
        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {loading ? (
            <div className="col-span-full py-20 text-center text-zinc-500">
              Loading bookmarks...
            </div>
          ) : paginatedBookmarks.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <Bookmark className="mx-auto mb-4 h-12 w-12 text-zinc-700" />

              <p className="text-zinc-500">No bookmarks found</p>
            </div>
          ) : (
            paginatedBookmarks.map((item) => (
              <Link
                key={item.comics.id}
                href={`/comic/${item.comics.seo_slug ?? item.comics.id}`}
                className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40 transition hover:border-indigo-500/40"
              >
                <div className="aspect-2/3 bg-zinc-900">
                  {item.comics.cover_path && (
                    <img
                      src={`${baseUrl}${item.comics.cover_path}`}
                      alt={item.comics.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold text-white">
                    {item.comics.title}
                  </h3>

                  <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                    <Clock3 className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeBookmark(item.comics.id);
                    }}
                    className="rounded-xl bg-red-500/10 p-2 text-red-300 backdrop-blur-xl hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Link>
            ))
          )}
        </div>
        {/* Pagination */}
        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-400 transition hover:border-indigo-500 hover:text-white disabled:opacity-40"
          >
            Prev
          </button>

          <span className="px-4 text-sm text-zinc-400">
            {page} / {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-400 transition hover:border-indigo-500 hover:text-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}
