"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
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
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Star,
  Clock3,
  BookmarkPlus,
  Bookmark,
  Pencil,
  Trash2,
  ArrowLeft,
  ImageIcon,
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
import { Loading } from "@/components/loading";

type ComicMetadata = {
  id: string;
  title: string;
  alternative_title: string | null;
  description: string | null;
  legacy_id: number;
  cover_path: string | null;
  total_chapters: number;

  status: {
    id: string;
    name: string;
  };

  category: {
    id: string;
    name: string;
    slug: string;
  };

  tags: {
    id: string;
    name: string;
    slug: string;
  }[];

  parodies: {
    id: string;
    name: string;
    slug: string;
  }[];

  characters: {
    id: string;
    name: string;
    slug: string;
  }[];

  artists: {
    id: string;
    name: string;
    slug: string;
  }[];

  authors: {
    id: string;
    name: string;
    slug: string;
  }[];

  groups: {
    id: string;
    name: string;
    slug: string;
  }[];

  created_at: string;
  updated_at: string;
};

type ComicChapter = {
  id: string;
  title: string;
  chapter_number: string;
  total_pages: number;
  published_at: string;

  language: {
    code: string;
    name: string;
  };

  censorship: {
    id: string;
    name: string;
  };

  pages: {
    id: string;
    filename: string;
    filepath: string;
    page_number: number;
  }[];
};

type ComicChaptersResponse = {
  data: ComicChapter[];
  comic_id: string;
  total_chapters: number;
};

async function getComicMetadata(id: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  const response = await fetch(`${baseUrl}/comics/${id}/metadata`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch comic metadata");
  }

  return response.json();
}

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

const metadataQueryMap = {
  parody: "parodies",
  character: "characters",
  author: "authors",
  artist: "artists",
  group: "groups",
  tag: "tags",
} as const;

function MetadataRow({
  item,
  isLast,
}: {
  item: {
    label: string;
    type: MetadataType;
    values: Array<{ id: string | number; name: string; slug?: string }>;
  };
  isLast: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_LIMIT = 15;
  const hasMore = item.values.length > INITIAL_LIMIT;

  const displayedValues = isExpanded
    ? item.values
    : item.values.slice(0, INITIAL_LIMIT);

  return (
    <div
      className={`grid items-start gap-3 px-4 py-3 sm:px-5 lg:grid-cols-[110px_1fr] ${
        !isLast ? "border-b border-border/50" : ""
      }`}
    >
      <div className="pt-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {item.label}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {displayedValues.map((value) => (
          <Link
            key={value.id}
            href={`/?${metadataQueryMap[item.type]}=${encodeURIComponent(
              value.slug || value.name,
            )}`}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              metadataStyles[item.type]
            }`}
          >
            {value.name}
          </Link>
        ))}

        {hasMore && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg border border-dashed border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-muted hover:text-primary/80"
          >
            {isExpanded
              ? "Show Less"
              : `+${item.values.length - INITIAL_LIMIT} more`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ComicDetailPage() {
  const router = useRouter();
  const params = useParams();

  const slug = params.slug as string;
  const [comic, setComic] = useState<ComicMetadata | null>(null);
  const [loadingComic, setLoadingComic] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOrderingMode, setIsOrderingMode] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [isRandomLoading, setIsRandomLoading] = useState(false);

  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  const coverUrl = comic?.cover_path ? `${baseUrl}${comic.cover_path}` : null;

  useEffect(() => {
    const fetchComic = async () => {
      try {
        setLoadingComic(true);

        const data: ComicMetadata = await getComicMetadata(slug);
        setComic(data);

        const bookmarkResponse = await fetch(`${baseUrl}/bookmarks/${data.id}`);
        if (bookmarkResponse.ok) {
          const bookmarkData = await bookmarkResponse.json();
          setBookmarked(bookmarkData.bookmarked);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingComic(false);
      }
    };

    if (slug) {
      fetchComic();
    }
  }, [slug, baseUrl]);

  const handleBookmark = async () => {
    if (!comic?.id || bookmarkLoading) {
      return;
    }

    const previousState = bookmarked;
    try {
      setBookmarkLoading(true);
      setBookmarked(!previousState);

      const response = await fetch(`${baseUrl}/bookmarks/${comic.id}`, {
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

  // Chapters State
  const [chapters, setChapters] = useState<ComicChapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        setLoadingChapters(true);
        const baseUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
        const response = await fetch(`${baseUrl}/comics/${slug}/chapters`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch chapters");
        }

        const result: ComicChaptersResponse = await response.json();
        setChapters(result.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingChapters(false);
      }
    };

    if (slug) {
      fetchChapters();
    }
  }, [slug]);
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

  // Thumbnail Modal State
  const [selectedChapter, setSelectedChapter] = useState<ComicChapter | null>(
    null,
  );
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

  const CHAPTERS_PER_PAGE = 7;
  const totalPages = Math.ceil(chapters.length / CHAPTERS_PER_PAGE);
  const paginatedChapters = chapters.slice(
    (currentPage - 1) * CHAPTERS_PER_PAGE,
    currentPage * CHAPTERS_PER_PAGE,
  );
  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(chapters.length / CHAPTERS_PER_PAGE),
    );
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [chapters, currentPage]);

  const [deletingComic, setDeletingComic] = useState(false);
  const handleDeleteComic = async () => {
    if (!comic?.id) return;

    const confirmed = window.confirm(
      `Delete comic "${comic.title}"?\n\nThis will permanently delete:\n- Comic metadata\n- All chapters\n- All pages\n- All images`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingComic(true);

      const baseUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
      const response = await fetch(`${baseUrl}/comics/${comic.id}`, {
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/comics/random`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch random comic");
      }

      const comicData = await response.json();
      const targetSlug = comicData?.seo_slug ?? comicData?.id;
      if (targetSlug) {
        router.push(`/comic/${targetSlug}`);
      } else {
        console.warn("Random comic returned empty payload:", comicData);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to load random comic");
    } finally {
      setIsRandomLoading(false);
    }
  };

  if (loadingComic || !comic) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loading text="Loading comic..." />
      </main>
    );
  }

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
                <Link href={comic?.id ? `/comic/${comic.id}/edit` : "#"}>
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
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={comic.title}
                        fill
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
                {chapters && chapters.length > 0 && comic?.id ? (
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
              {/* Header Tags / Badges */}
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
                  {comic.category.name}
                </span>
              </div>

              {/* Title Section */}
              <div className="group relative max-w-4xl">
                <h1 className="line-clamp-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  {comic.title}
                </h1>

                {/* Tooltip untuk membaca judul utuh jika terpotong line-clamp */}
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

              {/* Timestamps Info Grid */}
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

              {/* Synopsis Section */}
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

            {comic?.id && (
              <Link
                href={`/comic/${comic.id}/chapter/create`}
                className="group flex h-11 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 active:scale-95"
              >
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                <span>Add Chapter</span>
              </Link>
            )}
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
              {loadingChapters ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-3xl border border-border/60 bg-card/60 p-5 shadow-xs"
                  >
                    <div className="h-5 w-40 rounded bg-muted/60" />
                    <div className="mt-3 h-4 w-24 rounded bg-muted/60" />
                  </div>
                ))
              ) : chapters.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border/80 bg-card p-8 text-center text-sm text-muted-foreground shadow-xs">
                  No chapters available
                </div>
              ) : (
                paginatedChapters.map((chapter) => (
                  <SortableChapterCard
                    key={chapter.id}
                    chapter={chapter}
                    comicId={comic?.id ?? ""}
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

      {/* ================= THUMBNAIL MODAL ================= */}
      {selectedChapter && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-all duration-200">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-5xl rounded-3xl border border-border/80 bg-card shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {selectedChapter.title}
                  </h2>

                  <p className="mt-0.5 text-xs text-muted-foreground/80">
                    {selectedChapter.total_pages} pages
                  </p>
                </div>

                <button
                  onClick={() => setSelectedChapter(null)}
                  className="rounded-2xl border border-border/80 bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground shadow-xs"
                >
                  Close
                </button>
              </div>

              <div className="max-h-[80vh] overflow-y-auto p-5">
                {selectedChapter.pages.length === 0 ? (
                  <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                    No thumbnails available
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {selectedChapter.pages.map((page) => {
                      const imageUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}${page.filepath}`;

                      return (
                        <div
                          key={page.id}
                          className="group relative aspect-3/4 overflow-hidden rounded-2xl border border-border/80 bg-muted/40 transition-all duration-200 hover:border-primary/60 hover:shadow-xs"
                        >
                          <span className="absolute left-2 top-2 z-10 rounded-lg border border-black/10 bg-black/65 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-xs shadow-xs">
                            Page {page.page_number}
                          </span>

                          <img
                            src={imageUrl}
                            alt={page.filename}
                            className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />

                          <div className="pointer-events-none absolute inset-0 bg-primary/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Chapter Card Component
function SortableChapterCard({
  chapter,
  comicId,
  isOrderingMode,
  setSelectedChapter,
}: {
  chapter: ComicChapter;
  comicId: string;
  isOrderingMode: boolean;
  setSelectedChapter: (chapter: ComicChapter | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: chapter.id,
    disabled: !isOrderingMode,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    willChange: "transform",
  };
  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex min-h-22 items-center justify-between rounded-3xl border px-5 py-4 backdrop-blur-xs transition-all duration-200 ${
        isDragging
          ? "z-50 border-primary bg-card shadow-xl"
          : isOrderingMode
            ? "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15"
            : "border-border/80 bg-card hover:border-primary/40 hover:bg-accent/40 shadow-xs"
      }`}
    >
      {/* Left */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 shrink-0">
            <button
              {...attributes}
              {...listeners}
              className={`absolute inset-0 flex items-center justify-center rounded-2xl border transition-all duration-200 ${
                isOrderingMode
                  ? "cursor-grab border-amber-500/40 bg-amber-500/20 text-amber-700 hover:border-amber-500 hover:text-amber-900 active:cursor-grabbing scale-100 opacity-100 visibility-visible"
                  : "pointer-events-none scale-75 opacity-0 invisible"
              }`}
            >
              <GripVertical className="h-4 w-4" />
            </button>

            {/* Edit */}
            <Link
              href={`/comic/${comicId}/chapter/${chapter.id}/edit`}
              className={`absolute inset-0 flex items-center justify-center rounded-2xl border transition-all duration-200 ${
                isOrderingMode
                  ? "pointer-events-none scale-75 opacity-0 invisible"
                  : "border-border/80 bg-muted/60 text-muted-foreground hover:border-primary/50 hover:bg-accent hover:text-foreground scale-100 opacity-100 visibility-visible shadow-xs"
              }`}
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-muted/80 border border-border/80 text-sm font-black text-foreground shadow-xs">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium leading-none mb-0.5">
              CH
            </span>
            <span className="leading-none text-base">
              {chapter.chapter_number}
            </span>
          </div>

          <div className="min-w-0 flex-1 shared-info-layout">
            <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {chapter.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                {chapter.total_pages} Pages
              </span>
              <span className="text-border">•</span>
              <span>
                Released{" "}
                {new Date(chapter.published_at).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`flex items-center gap-3 transition-all duration-200 ${
          isOrderingMode
            ? "pointer-events-none translate-x-4 opacity-0 invisible"
            : "translate-x-0 opacity-100 visibility-visible"
        }`}
      >
        <span className="hidden rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-700 shadow-xs sm:block">
          {chapter.censorship?.name || "Unknown"}
        </span>

        <button
          onClick={() => setSelectedChapter(chapter)}
          className="group/btn flex h-12 items-center gap-2 overflow-hidden rounded-2xl border border-border/80 bg-background px-3.5 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:bg-accent hover:text-foreground shadow-xs"
        >
          <ImageIcon className="h-4 w-4 text-muted-foreground transition group-hover/btn:scale-110 group-hover/btn:text-primary" />
          <span>Thumbnail</span>
        </button>

        <Link
          href={`/comic/${comicId}/chapter/${chapter.id}`}
          className="group/btn flex h-12 items-center gap-2 rounded-2xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 shadow-xs"
        >
          <BookOpen className="h-4 w-4 transition group-hover/btn:scale-110" />
          <span>Read Chapter</span>
        </Link>
      </div>
    </div>
  );
}
