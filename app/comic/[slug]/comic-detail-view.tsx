"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Star,
  Clock3,
  BookmarkPlus,
  Bookmark,
  Pencil,
  Trash2,
  ArrowLeft,
  BookOpen,
  Plus,
  GripVertical,
  Check,
  ArrowUpDown,
  Search,
  Dices,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { BACKEND_URL } from "@/lib/constant";
import { ComicChapter, ComicMetadata } from "@/types/detailPage";
import { MetadataRow } from "@/components/MetadataRow";
import { SortableChapterCard } from "@/components/SortableChapterCard";
import { ThumbnailModal } from "@/components/ThumbnailModal";

const statusPremiumStyles: Record<string, string> = {
  Completed: "bg-emerald-500 shadow-emerald-500/20 text-white",
  Ongoing: "bg-sky-500 shadow-sky-500/20 text-white",
  "Not Completed": "bg-rose-500 shadow-rose-500/20 text-white",
  Unknown: "bg-zinc-500 shadow-zinc-500/20 text-white",
};

const metadataStyles = {
  parody:
    "border-slate-200 bg-slate-100/80 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700",
  character:
    "border-slate-200 bg-slate-100/80 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700",
  author:
    "border-slate-200 bg-slate-100/80 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700",
  artist:
    "border-slate-200 bg-slate-100/80 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700",
  group:
    "border-slate-200 bg-slate-100/80 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700",
  tag: "border-slate-200 bg-slate-100/80 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700",
} as const;

type MetadataType = keyof typeof metadataStyles;

interface ComicDetailViewProps {
  initialComic: ComicMetadata;
  initialChapters: ComicChapter[];
  slug: string;
}

export function ComicDetailView({
  initialComic,
  initialChapters,
  slug,
}: ComicDetailViewProps) {
  const router = useRouter();

  // State
  const [comic] = useState<ComicMetadata>(initialComic);
  const [chapters, setChapters] = useState<ComicChapter[]>(initialChapters);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOrderingMode, setIsOrderingMode] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [isRandomLoading, setIsRandomLoading] = useState(false);
  const [deletingComic, setDeletingComic] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<ComicChapter | null>(
    null,
  );

  // Fetch initial bookmark status for the user
  useEffect(() => {
    const fetchBookmarkStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/bookmarks/${comic.id}`);
        if (res.ok) {
          const data = await res.json();
          setBookmarked(Boolean(data.bookmarked));
        }
      } catch (err) {
        console.error("Failed to fetch bookmark status:", err);
      }
    };

    if (comic?.id) {
      fetchBookmarkStatus();
    }
  }, [comic?.id]);

  const handleBookmark = async () => {
    if (!comic?.id || bookmarkLoading) return;

    const previousState = bookmarked;
    try {
      setBookmarkLoading(true);
      setBookmarked(!previousState);

      const response = await fetch(`${BACKEND_URL}/bookmarks/${comic.id}`, {
        method: "POST",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to update bookmark");
      }

      setBookmarked(result.bookmarked);
    } catch (error) {
      console.error(error);
      setBookmarked(previousState);
      alert("Failed to update bookmark");
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Drag and Drop (Reordering)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setChapters((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  // Thumbnail Modal Handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedChapter(null);
      }
    };
    if (selectedChapter) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedChapter]);

  // Pagination Logic
  const CHAPTERS_PER_PAGE = 7;
  const totalPages = Math.max(
    1,
    Math.ceil(chapters.length / CHAPTERS_PER_PAGE),
  );
  const paginatedChapters = chapters.slice(
    (currentPage - 1) * CHAPTERS_PER_PAGE,
    currentPage * CHAPTERS_PER_PAGE,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [chapters, currentPage, totalPages]);

  const handleDeleteComic = async () => {
    if (!comic?.id) return;

    const confirmed = window.confirm(
      `Delete comic "${comic.title}"?\n\nThis will permanently delete:\n- Comic metadata\n- All chapters\n- All pages\n- All images`,
    );

    if (!confirmed) return;

    try {
      setDeletingComic(true);
      const response = await fetch(`${BACKEND_URL}/comics/${comic.id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to delete comic");
      }
      alert(
        `Comic deleted successfully.\n\nDeleted chapters: ${result.deleted_chapters}\nDeleted pages: ${result.deleted_pages}`,
      );
      router.push("/");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to delete comic");
    } finally {
      setDeletingComic(false);
    }
  };

  const handleRandomComic = async () => {
    if (isRandomLoading) return;

    setIsRandomLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/comics/random`);
      if (!response.ok) {
        throw new Error("Failed to fetch random comic");
      }

      const comicData = await response.json();
      const targetSlug = comicData?.seo_slug ?? comicData?.id;
      if (targetSlug) {
        router.push(`/comic/${targetSlug}`);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to load random comic");
    } finally {
      setIsRandomLoading(false);
    }
  };

  return (
    <>
      <div className="relative min-h-screen overflow-hidden">
        <Header
          logo={false}
          showSearch={false}
          leftContent={
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-1.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>
            </Button>
          }
          centerContent={
            <Button
              title="Random Comic"
              variant="ghost"
              size="sm"
              onClick={handleRandomComic}
              disabled={isRandomLoading}
              className="gap-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0 disabled:opacity-50"
            >
              {isRandomLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Dices className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Random</span>
            </Button>
          }
          rightContent={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="gap-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Link href={`/comic/${comic.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Link>
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteComic}
                disabled={deletingComic}
                className="gap-2 rounded-xl text-xs font-medium transition-transform hover:scale-105 text-white"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {deletingComic ? "Deleting..." : "Delete"}
                </span>
              </Button>
            </div>
          }
        />

        {/* Metadata */}
        <section
          id="metadata"
          className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
        >
          <div className="grid w-full items-center gap-8 xl:grid-cols-[300px_1fr]">
            <div className="mx-auto w-full max-w-75">
              <div className="relative">
                <div className="absolute inset-0 scale-95 rounded-4xl bg-primary/10 blur-2xl" />
                <div className="relative overflow-hidden rounded-4xl border border-border/80 bg-card shadow-sm">
                  <div className="relative aspect-2/3 w-full overflow-hidden bg-muted/40">
                    {comic.cover_path ? (
                      <Image
                        src={`${BACKEND_URL}${comic.cover_path}`}
                        alt={comic.title}
                        fill
                        loading="eager"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted/40 text-xs font-medium text-muted-foreground">
                        No Cover
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {chapters.length > 0 ? (
                  <Link
                    href={`/comic/${comic.id}/chapter/${chapters[0].id}`}
                    className="group flex w-full items-center justify-center gap-2 rounded-3xl bg-primary px-5 py-4 text-sm font-bold text-primary-foreground shadow-md transition hover:scale-[1.02] hover:bg-primary/90"
                  >
                    <BookOpen className="h-4 w-4 transition group-hover:scale-110" />
                    <span>Read First Chapter</span>
                  </Link>
                ) : (
                  <Button
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-3xl bg-muted px-5 py-4 text-sm font-bold text-muted-foreground"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>No Chapters Available</span>
                  </Button>
                )}

                <button
                  onClick={handleBookmark}
                  disabled={bookmarkLoading}
                  className={`
                    flex w-full items-center justify-center gap-2
                    rounded-3xl px-5 py-4 text-sm font-semibold
                    transition disabled:opacity-50
                    ${
                      bookmarked
                        ? "border border-primary/40 bg-primary/10 text-primary"
                        : "border border-border/80 bg-card text-foreground hover:border-primary/50 hover:bg-accent/60"
                    }
                  `}
                >
                  {bookmarked ? (
                    <Bookmark className="h-4 w-4 fill-current" />
                  ) : (
                    <BookmarkPlus className="h-4 w-4 text-muted-foreground" />
                  )}

                  <span>
                    {bookmarkLoading
                      ? "Loading..."
                      : bookmarked
                        ? "Bookmarked"
                        : "Add Bookmark"}
                  </span>
                </button>

                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-4 backdrop-blur-xs">
                  <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <button
                        key={index}
                        className="group transition hover:scale-115"
                      >
                        <Star
                          className={`h-7 w-7 transition ${
                            index < 4
                              ? "fill-amber-400 text-amber-400"
                              : "text-amber-500/25"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <p className="mt-3 text-center text-[11px] text-muted-foreground/80">
                    Tap a star to rate this comic
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              {/* Header Badges */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-1.5 shadow-xs">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    ID
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    #{comic.legacy_id}
                  </span>
                </div>

                <span
                  className={`rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide shadow-xs transition-all duration-300 ${
                    statusPremiumStyles[comic.status?.name] ||
                    "border border-border/60 bg-secondary text-secondary-foreground"
                  }`}
                >
                  {comic.status?.name || "Unknown"}
                </span>

                <span className="rounded-xl border border-border/80 bg-card px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground shadow-xs">
                  {comic.category?.name}
                </span>
              </div>

              {/* Title Section */}
              <div className="group relative max-w-4xl">
                <h1 className="line-clamp-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  {comic.title}
                </h1>
                <div className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden max-w-xl rounded-xl border border-border/80 bg-popover p-3 text-xs opacity-0 shadow-lg backdrop-blur-md transition group-hover:block group-hover:opacity-100">
                  <p className="text-popover-foreground">{comic.title}</p>
                </div>
              </div>

              {/* Alternative Title */}
              {comic.alternative_title && (
                <p className="mt-2 max-w-4xl text-xs text-muted-foreground/80 sm:text-sm">
                  {comic.alternative_title}
                </p>
              )}

              {/* Metadata List Container */}
              <div className="mt-5 rounded-2xl border border-border/80 bg-card/60 shadow-xs">
                {[
                  {
                    label: "Parodies",
                    type: "parody" as MetadataType,
                    values: comic.parodies,
                  },
                  {
                    label: "Characters",
                    type: "character" as MetadataType,
                    values: comic.characters,
                  },
                  {
                    label: "Authors",
                    type: "author" as MetadataType,
                    values: comic.authors,
                  },
                  {
                    label: "Artists",
                    type: "artist" as MetadataType,
                    values: comic.artists,
                  },
                  {
                    label: "Groups",
                    type: "group" as MetadataType,
                    values: comic.groups,
                  },
                  {
                    label: "Tags",
                    type: "tag" as MetadataType,
                    values: comic.tags,
                  },
                ]
                  .filter((item) => item.values && item.values.length > 0)
                  .map((item, index, array) => (
                    <MetadataRow
                      key={item.label}
                      item={item}
                      isLast={index === array.length - 1}
                    />
                  ))}
              </div>

              {/* Timestamps */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
                <div className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-card px-3.5 py-2.5 shadow-xs">
                  <Clock3 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Created:{" "}
                    <strong className="font-semibold text-foreground">
                      {comic.created_at
                        ? new Date(comic.created_at).toLocaleDateString()
                        : "Unknown"}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-card px-3.5 py-2.5 shadow-xs">
                  <Clock3 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Updated:{" "}
                    <strong className="font-semibold text-foreground">
                      {comic.updated_at
                        ? new Date(comic.updated_at).toLocaleDateString()
                        : "Unknown"}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Synopsis */}
              {comic.description && (
                <div className="mt-6 max-w-4xl">
                  <h2 className="mb-2 text-base font-bold text-foreground">
                    Synopsis
                  </h2>
                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {comic.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Chapter Section */}
      <section
        id="chapters"
        className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"
      >
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-start sm:gap-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-foreground">
                Chapters
              </h2>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground/80">
                {chapters.length} chapters available
              </p>
            </div>

            <Link
              href={`/comic/${comic.id}/chapter/create`}
              className="group flex h-11 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 active:scale-95"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              <span>Add Chapter</span>
            </Link>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() => setIsOrderingMode((prev) => !prev)}
              className={`flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold border transition-all duration-200 active:scale-95 ${
                isOrderingMode
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 shadow-xs hover:bg-emerald-500/20"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-700 shadow-xs hover:bg-amber-500/20"
              }`}
            >
              {isOrderingMode ? (
                <>
                  <Check className="h-4 w-4 animate-pulse" />
                  <span>Save Ordering</span>
                </>
              ) : (
                <>
                  <GripVertical className="h-4 w-4" />
                  <span>Edit Ordering</span>
                </>
              )}
            </button>

            <div className="relative flex-1 sm:w-64 sm:flex-none">
              <input
                type="text"
                placeholder="Search chapter..."
                className="w-full rounded-2xl border border-border/80 bg-card py-3 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground/70 outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-xs"
              />
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
            </div>

            <button className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card px-4 text-sm font-medium text-foreground transition-all duration-200 hover:border-primary/40 hover:bg-accent/60 active:scale-95 shadow-xs">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <span>Latest First</span>
            </button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={chapters.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex-1 space-y-3">
              {chapters.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border/80 bg-card p-8 text-center text-sm text-muted-foreground shadow-xs">
                  No chapters available
                </div>
              ) : (
                paginatedChapters.map((chapter) => (
                  <SortableChapterCard
                    key={chapter.id}
                    chapter={chapter}
                    comicId={comic.id}
                    isOrderingMode={isOrderingMode}
                    setSelectedChapter={setSelectedChapter}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="rounded-2xl border border-border/80 bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/60 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-xs"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-11 min-w-11 rounded-2xl px-4 text-sm font-semibold transition-colors ${
                    page === currentPage
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border border-border/80 bg-card text-foreground hover:border-primary/50 hover:bg-accent/60 shadow-xs"
                  }`}
                >
                  {page}
                </button>
              ),
            )}

            <button
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="rounded-2xl border border-border/80 bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/60 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-xs"
            >
              Next
            </button>
          </div>
        )}
      </section>

      <ThumbnailModal
        selectedChapter={selectedChapter}
        onClose={() => setSelectedChapter(null)}
      />
    </>
  );
}
