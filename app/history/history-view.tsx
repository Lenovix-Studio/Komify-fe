"use client";

import Link from "next/link";
import { History, Clock3, Search, Trash2, X, BookOpen } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { PaginationControl } from "@/components/pagination";
import { toast } from "sonner";
import { BACKEND_URL } from "@/lib/constant";
import { HistoryItem } from "@/types/historyPage";
import { formatChapterNumber } from "@/lib/utils";

interface HistoryViewProps {
  initialHistories: HistoryItem[];
}

export function HistoryView({ initialHistories }: HistoryViewProps) {
  const [histories, setHistories] = useState<HistoryItem[]>(initialHistories);
  const [search, setSearch] = useState("");
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const removeHistory = async (comicId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/history/${comicId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete history");
      }

      setHistories((prev) => prev.filter((x) => x.comics.id !== comicId));

      toast.success("Riwayat dihapus", {
        description: "Komik telah dihapus dari daftar riwayat baca.",
      });
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal menghapus riwayat", {
        description: error.message || "Terjadi kesalahan saat menghapus data.",
      });
    }
  };

  const clearAllHistories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/history`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed");
      }

      setHistories([]);
      toast.success("Semua riwayat dibersihkan");
    } catch (error) {
      console.error(error);
      toast.error("Gagal membersihkan riwayat");
    } finally {
      setIsClearAllOpen(false);
    }
  };

  const filteredHistories = histories.filter((item) =>
    item.comics?.title?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHistories.length / PAGE_SIZE),
  );
  const paginatedHistories = filteredHistories.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Header
        logo={true}
        showSearch={false}
        showRandom={false}
        leftContent={false}
      />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Title & Actions */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Reading History
              </h1>
              <p className="text-xs font-medium text-muted-foreground/80">
                {histories.length} comics in your history
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search history..."
                className="w-full rounded-2xl border-border/80 bg-card py-3 pl-11 pr-10 text-sm shadow-xs"
              />
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {histories.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setIsClearAllOpen(true)}
                className="gap-2 rounded-2xl border-border/80 bg-card text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 shadow-xs"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Clear All</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content List */}
        {paginatedHistories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/50 p-16 text-center shadow-xs">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-4">
              <History className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold">No reading history found</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {search
                ? "No history matches your search query."
                : "Chapters you read will automatically appear here."}
            </p>
            <Button asChild className="mt-6 rounded-2xl">
              <Link href="/">Explore Comics</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {paginatedHistories.map((item) => {
              const comic = item.comics;
              const chapter = item.chapters;
              if (!comic) return null;
              const slug = comic.seo_slug || comic.id;

              return (
                <div
                  key={item.id}
                  className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Link
                      href={`/comic/${slug}`}
                      className="relative aspect-2/3 h-20 w-14 shrink-0 overflow-hidden rounded-2xl border border-border/85 bg-muted shadow-xs"
                    >
                      {comic.cover_path ? (
                        <img
                          src={`${BACKEND_URL}${comic.cover_path}`}
                          alt={comic.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                          No Cover
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0">
                      <Link
                        href={`/comic/${slug}`}
                        className="truncate text-base font-bold text-foreground hover:text-primary transition-colors block"
                      >
                        {comic.title}
                      </Link>

                      {comic.alternative_title && (
                        <p className="truncate text-xs text-muted-foreground/80 mt-0.5">
                          {comic.alternative_title}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        {chapter && (
                          <span className="font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                            Chapter{" "}
                            {formatChapterNumber(chapter.chapter_number)}
                            {chapter.title ? ` - ${chapter.title}` : ""}
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-muted-foreground font-medium">
                          <Clock3 className="h-3.5 w-3.5" />
                          {new Date(item.updated_at).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border/65">
                    {chapter && (
                      <Button
                        asChild
                        size="sm"
                        className="gap-2 rounded-xl font-semibold shadow-xs flex-1 sm:flex-none"
                      >
                        <Link href={`/comic/${slug}/chapter/${chapter.id}`}>
                          <BookOpen className="h-4 w-4" />
                          <span>Continue Reading</span>
                        </Link>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setItemToDelete(comic.id)}
                      className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
                      title="Remove from history"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <PaginationControl
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* Single Delete Confirmation */}
      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus dari Riwayat</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Apakah Anda yakin ingin menghapus komik ini dari riwayat baca?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-border bg-background">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDelete) {
                  removeHistory(itemToDelete);
                  setItemToDelete(null);
                }
              }}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Confirmation */}
      <AlertDialog open={isClearAllOpen} onOpenChange={setIsClearAllOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Bersihkan Semua Riwayat</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tindakan ini akan menghapus seluruh riwayat membaca Anda secara
              permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-border bg-background">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={clearAllHistories}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Bersihkan Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
