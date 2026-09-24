"use client";

import { Bookmark, Upload, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { PaginationControl } from "@/components/pagination";
import { ComicCard, ComicCardSkeleton } from "@/components/comic-card";
import type { Comic, HomepageResponse } from "@/types/homePage";
import { BACKEND_URL } from "@/lib/constant";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
  Completed: "bg-emerald-500 text-white",
  Ongoing: "bg-sky-500 text-white",
  "Not Completed": "bg-rose-500 text-white",
  Unknown: "bg-zinc-500 text-white",
};

interface ContentProps {
  initialData: HomepageResponse;
  initialParams: Record<string, string | undefined>;
}

export default function Content({ initialData, initialParams }: ContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [comics, setComics] = useState<Comic[]>(initialData.data);
  const [pagination, setPagination] = useState(initialData.pagination);
  const [loading, setLoading] = useState(false);
  const [isRandomLoading, setIsRandomLoading] = useState(false);

  const [searchInput, setSearchInput] = useState(initialParams.q ?? "");

  // Update state lokal ketika Server Data berubah dari URL
  useEffect(() => {
    setComics(initialData.data);
    setPagination(initialData.pagination);
  }, [initialData]);

  // Sync Search Input dengan URL jika URL berubah eksternal
  useEffect(() => {
    setSearchInput(searchParams.get("q") ?? "");
  }, [searchParams]);

  // Debounce Search untuk memperbarui URL Query Parameters
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQuery = searchParams.get("q") ?? "";
      if (searchInput !== currentQuery) {
        updateQueryParams({ q: searchInput, page: "1" });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateQueryParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  // Live Auto-Update
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/comics?${searchParams.toString()}`,
          {
            cache: "no-store",
          },
        );

        if (!res.ok) throw new Error("Server error");

        const result: HomepageResponse = await res.json();
        setComics(result.data);
        setPagination(result.pagination);

        toast.dismiss("auto-update-error");
      } catch (error) {
        console.error("Failed to auto-update comics:", error);

        toast.error("Gagal memperbarui data", {
          id: "auto-update-error",
          description:
            "Gagal terhubung ke server untuk memperbarui daftar komik.",
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [searchParams]);

  const handleRandomComic = async () => {
    if (isRandomLoading) {
      toast.info("Please wait", {
        description: "Looking for another random comic...",
      });
      return;
    }

    setIsRandomLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/comics/random`);

      if (!response.ok) throw new Error("Failed to fetch random comic");

      const comic = await response.json();
      const targetSlug = comic?.seo_slug ?? comic?.id;

      if (targetSlug) {
        router.push(`/comic/${targetSlug}`);
      } else {
        throw new Error("Comic data is incomplete");
      }
    } catch (error: any) {
      console.error(error);

      toast.error("Gagal memuat komik acak", {
        description: error.message || "Terjadi kesalahan pada server.",
      });
    } finally {
      setIsRandomLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    updateQueryParams({ q: null, page: "1" });
  };

  const currentPage = Number(searchParams.get("page") ?? "1");

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <Header
        searchValue={searchInput}
        onSearchChange={(val) => setSearchInput(val)}
        onSearchClear={handleClearSearch}
        onRandomClick={handleRandomComic}
        isRandomLoading={isRandomLoading}
        rightContent={
          <>
            <Button
              variant="ghost"
              asChild
              className="gap-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Link href="/bookmark">
                <Bookmark className="h-4 w-4 text-muted-foreground/80" />
                <span className="hidden md:inline">Bookmark</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              asChild
              className="gap-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Link href="/upload">
                <Upload className="h-4 w-4 text-muted-foreground/80" />
                <span className="hidden md:inline">Upload</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              asChild
              className="gap-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Link href="/settings">
                <Settings className="h-4 w-4 text-muted-foreground/80" />
                <span className="hidden md:inline">Settings</span>
              </Link>
            </Button>
          </>
        }
      />

      <section className="mx-auto flex flex-1 w-full max-w-7xl flex-col">
        <div className="flex-1 overflow-y-auto py-4 pr-1">
          {comics.length > 0 || loading || isPending ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {loading || isPending
                ? Array.from({ length: 12 }).map((_, index) => (
                    <ComicCardSkeleton key={index} />
                  ))
                : comics.map((comic) => (
                    <ComicCard
                      key={comic.id}
                      comic={comic}
                      statusStyles={statusStyles}
                    />
                  ))}
            </div>
          ) : null}

          {!loading && !isPending && comics.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center shadow-xs">
              <div className="mb-3 rounded-full bg-accent/60 p-4">
                <svg
                  className="h-8 w-8 text-muted-foreground/80"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground">
                Tidak Ada Komik
              </h3>
              <p className="mt-1 text-sm text-muted-foreground/80">
                Belum ada data komik yang tersedia saat ini.
              </p>
            </div>
          )}
        </div>

        {!loading && pagination.total_data > 12 && (
          <div className="shrink-0 border-t border-border/40 bg-background/95 py-3 backdrop-blur-md">
            <PaginationControl
              currentPage={currentPage}
              totalPages={pagination.total_pages}
              onPageChange={(newPage) =>
                updateQueryParams({ page: newPage.toString() })
              }
              hasNext={pagination.has_next}
              hasPrev={currentPage > 1}
            />
          </div>
        )}
      </section>
    </main>
  );
}
