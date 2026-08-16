"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

  const metadataStyles = {
    parody:
      "border-purple-500/20 bg-purple-500/10 text-purple-200 hover:border-purple-500 hover:bg-purple-500/20",
    character:
      "border-pink-500/20 bg-pink-500/10 text-pink-200 hover:border-pink-500 hover:bg-pink-500/20",
    author:
      "border-sky-500/20 bg-sky-500/10 text-sky-200 hover:border-sky-500 hover:bg-sky-500/20",
    artist:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-200 hover:border-emerald-500 hover:bg-emerald-500/20",
    group:
      "border-amber-500/20 bg-amber-500/10 text-amber-200 hover:border-amber-500 hover:bg-amber-500/20",
    tag: "border-zinc-700 bg-zinc-950/80 text-zinc-300 hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-white",
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
    <main className="min-h-screen">
      <div className="relative min-h-screen overflow-hidden bg-zinc-950">
        {/* Background */}
        <div className="absolute inset-0 bg-zinc-950" />

        {/* Glow Effects */}
        <div className="absolute left-1/2 top-0 h-175 w-175 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-100 w-100 rounded-full bg-fuchsia-500/5 blur-3xl" />

        {/* Overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-black/30 via-zinc-950/60 to-zinc-950" />

        {/* Header */}
        <Header
          logo={false}
          showSearch={false}
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
            <Button
              title="Random Comic"
              variant="outline"
              onClick={handleRandomComic}
              disabled={isRandomLoading}
              className="gap-2 rounded-xl border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-colors shrink-0 disabled:opacity-50"
            >
              {isRandomLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Dices className="h-4 w-4" />
              )}
            </Button>
          }
          rightContent={
            <div className="flex items-center gap-2">
              {/* Edit Comic */}
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-2 rounded-xl border-border/60 bg-muted/50 text-foreground hover:bg-muted"
              >
                <Link href={comic?.id ? `/comic/${comic.id}/edit` : "#"}>
                  <Pencil className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit Comic</span>
                </Link>
              </Button>

              {/* Delete Comic */}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteComic}
                disabled={deletingComic}
                className="gap-2 rounded-xl"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {deletingComic ? "Deleting..." : "Delete Comic"}
                </span>
              </Button>
            </div>
          }
        />

        {/* Metadata */}
        <section
          className="relative flex min-h-screen items-center px-6 py-6"
          id="metadata"
        >
          <div className="grid w-full items-center gap-8 xl:grid-cols-[300px_1fr]">
            {/* Cover */}
            <div className="mx-auto w-full max-w-75">
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 scale-95 rounded-4xl bg-indigo-500/20 blur-2xl" />

                {/* Cover */}
                <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-zinc-900 shadow-2xl">
                  <div className="relative aspect-2/3 w-full overflow-hidden bg-zinc-800">
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={comic.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full bg-zinc-800" />
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 space-y-3">
                {chapters && chapters.length > 0 && comic?.id ? (
                  <Link
                    href={`/comic/${comic.id}/chapter/${chapters[0].id}`}
                    className="group flex w-full items-center justify-center gap-2 rounded-3xl bg-indigo-500 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-500/20 transition hover:scale-[1.02] hover:bg-indigo-400"
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
                        ? "border border-indigo-500 bg-indigo-500/15 text-indigo-300"
                        : "border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-white"
                    }
                  `}
                >
                  {bookmarked ? (
                    <Bookmark className="h-4 w-4 fill-current" />
                  ) : (
                    <BookmarkPlus className="h-4 w-4" />
                  )}

                  <span>
                    {bookmarkLoading
                      ? "Loading..."
                      : bookmarked
                        ? "Bookmarked"
                        : "Add Bookmark"}
                  </span>
                </button>

                {/* Rating */}
                <div className="rounded-3xl border border-yellow-500/10 bg-yellow-500/5 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <button
                        key={index}
                        className="group transition hover:scale-115"
                      >
                        <Star
                          className={`h-7 w-7 transition ${
                            index < 4
                              ? "fill-yellow-300 text-yellow-300"
                              : "text-yellow-500/30"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <p className="mt-3 text-center text-[11px] text-zinc-500">
                    Tap a star to rate this comic
                  </p>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center">
              {/* Status */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {/* ID */}
                <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 backdrop-blur-sm">
                  <div className="h-2 w-2 rounded-full bg-indigo-400" />

                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    ID
                  </span>

                  <span className="text-xs font-bold text-white">
                    #{comic.legacy_id}
                  </span>
                </div>

                {/* Status */}
                <span
                  className={`rounded-2xl px-3 py-2 text-[10px] font-bold uppercase tracking-wide shadow-lg transition-all duration-300 ${
                    statusPremiumStyles[comic.status?.name] ||
                    "bg-zinc-500 shadow-zinc-500/20 text-white"
                  }`}
                >
                  {comic.status?.name || "Unknown"}
                </span>

                {/* Type */}
                <span className="rounded-2xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
                  {comic.category.name}
                </span>
              </div>

              {/* Title */}
              <div className="group relative max-w-5xl">
                <h1 className="line-clamp-2 min-h-20 text-4xl font-black tracking-tight text-white lg:min-h-30 lg:text-6xl lg:leading-[0.95]">
                  {comic.title}
                </h1>

                {/* Tooltip */}
                <div className="pointer-events-none absolute left-0 top-full z-30 mt-4 w-max max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-900/95 px-5 py-4 opacity-0 shadow-2xl backdrop-blur-xl transition duration-200 group-hover:opacity-100">
                  <p className="text-sm leading-7 text-white">{comic.title}</p>
                </div>
              </div>

              {/* Alternative */}
              {comic.alternative_title && (
                <p className="mt-3 max-w-4xl text-sm text-zinc-500">
                  {comic.alternative_title}
                </p>
              )}

              {/* Metadata */}
              <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
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
                  .filter((item) => item.values.length > 0)
                  .map((item, index, array) => (
                    <div
                      key={item.label}
                      className={`grid gap-4 px-5 py-4 lg:grid-cols-[100px_1fr] ${
                        index !== array.length - 1
                          ? "border-b border-zinc-800"
                          : ""
                      }`}
                    >
                      {/* Label */}
                      <div className="pt-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                          {item.label}
                        </p>
                      </div>

                      {/* Values */}
                      <div className="flex flex-wrap gap-2">
                        {item.values.map((value) => (
                          <Link
                            key={value.id}
                            href={`/?${metadataQueryMap[item.type]}=${encodeURIComponent(
                              value.slug || value.name,
                            )}`}
                            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                              metadataStyles[item.type]
                            }`}
                          >
                            {value.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Quick Meta */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/3 px-4 py-3 backdrop-blur-xl">
                  <Clock3 className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm text-zinc-300">
                    Created{" "}
                    {comic.created_at
                      ? new Date(comic.created_at).toLocaleDateString()
                      : "Unknown"}
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/3 px-4 py-3 backdrop-blur-xl">
                  <Clock3 className="h-4 w-4 text-indigo-400" />

                  <span className="text-sm text-zinc-300">
                    Updated {new Date(comic.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Synopsis */}
              {comic.description && (
                <div className="mt-5 max-w-5xl">
                  <h2 className="mb-3 text-lg font-bold text-white">
                    Synopsis
                  </h2>

                  <p className="text-sm leading-7 text-zinc-400">
                    {comic.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Chapter Section */}
      <section className="flex min-h-screen flex-col px-6 py-8" id="chapters">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Title & Add Action */}
          <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-start sm:gap-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white">
                Chapters
              </h2>
              <p className="mt-0.5 text-xs font-medium text-zinc-500">
                {chapters.length} chapters available
              </p>
            </div>

            {/* Add Chapter */}
            {comic?.id && (
              <Link
                href={`/comic/${comic.id}/chapter/create`}
                className="group flex h-11 items-center gap-2 rounded-2xl bg-indigo-500 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition-all duration-200 hover:bg-indigo-400 hover:shadow-indigo-500/20 active:scale-95"
              >
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                <span>Add Chapter</span>
              </Link>
            )}
          </div>

          {/* Right: Controls Panel */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Edit Ordering Button */}
            <button
              onClick={() => setIsOrderingMode((prev) => !prev)}
              className={`flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold border transition-all duration-200 active:scale-95 ${
                isOrderingMode
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5 hover:bg-emerald-500/20"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/5 hover:bg-amber-500/20"
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
            {/* Search Input Wrapper */}
            <div className="relative flex-1 sm:w-64 sm:flex-none">
              <input
                type="text"
                placeholder="Search chapter..."
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/40 py-3 pl-11 pr-4 text-sm text-zinc-200 placeholder-zinc-500 outline-none backdrop-blur-sm transition-all duration-200 focus:border-indigo-500 focus:bg-zinc-900/80 focus:ring-2 focus:ring-indigo-500/10"
              />
              {/* Icon Search ditambahkan sebagai pemanis visual */}
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>

            {/* Sort Button */}
            <button className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-all duration-200 hover:border-indigo-500/40 hover:bg-zinc-900/80 hover:text-white active:scale-95">
              <ArrowUpDown className="h-4 w-4 text-zinc-500" />
              <span>Latest First</span>
            </button>
          </div>
        </div>

        {/* Chapter List */}
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
                    className="animate-pulse rounded-3xl border border-zinc-800 bg-zinc-900/40 p-5"
                  >
                    <div className="h-5 w-40 rounded bg-zinc-800" />

                    <div className="mt-3 h-4 w-24 rounded bg-zinc-800" />
                  </div>
                ))
              ) : chapters.length === 0 ? (
                <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-sm text-zinc-500">
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
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {/* Previous */}
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-11 min-w-11 rounded-2xl px-4 text-sm font-semibold transition ${
                    page === currentPage
                      ? "bg-indigo-500 text-white"
                      : "border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-indigo-500 hover:text-white"
                  }`}
                >
                  {page}
                </button>
              ),
            )}

            {/* Next */}
            <button
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* ================= THUMBNAIL MODAL ================= */}
      {selectedChapter && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-400 rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {selectedChapter.title}
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    {selectedChapter.total_pages} pages
                  </p>
                </div>

                <button
                  onClick={() => setSelectedChapter(null)}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                >
                  Close
                </button>
              </div>

              {/* Body */}
              <div className="max-h-[80vh] overflow-y-auto p-5">
                {selectedChapter.pages.length === 0 ? (
                  <div className="flex items-center justify-center py-20 text-sm text-zinc-500">
                    No thumbnails available
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {selectedChapter.pages.map((page) => {
                      const imageUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}${page.filepath}`;

                      return (
                        <div
                          key={page.id}
                          className="group relative aspect-3/4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 transition hover:border-indigo-500/40"
                        >
                          {/* Page Badge */}
                          <span className="absolute left-2 top-2 z-10 rounded-lg bg-zinc-950/90 px-2 py-1 text-[10px] font-bold text-indigo-400 backdrop-blur">
                            Page {page.page_number}
                          </span>

                          {/* Thumbnail */}
                          <img
                            src={imageUrl}
                            alt={page.filename}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />

                          {/* Hover */}
                          <div className="pointer-events-none absolute inset-0 bg-black/10 opacity-0 transition group-hover:opacity-100" />
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
    </main>
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
      className={`group flex min-h-22 items-center justify-between rounded-3xl border px-5 py-4 backdrop-blur-sm transition-all duration-200 ${
        isDragging
          ? "z-50 border-amber-500 bg-zinc-900 shadow-2xl shadow-amber-500/10"
          : isOrderingMode
            ? "border-amber-500/20 bg-amber-500/5 hover:bg-zinc-900/80"
            : "border-zinc-800 bg-zinc-900/40 hover:border-indigo-500/40 hover:bg-zinc-900/80"
      }`}
    >
      {/* Left */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 shrink-0">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className={`absolute inset-0 flex items-center justify-center rounded-2xl border transition-all duration-200 ${
                isOrderingMode
                  ? "cursor-grab border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-amber-500 hover:text-white active:cursor-grabbing scale-100 opacity-100 visibility-visible"
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
                  : "border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-white scale-100 opacity-100 visibility-visible"
              }`}
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </div>

          {/* Number Badge */}
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-zinc-800/80 border border-zinc-700/50 text-sm font-black text-zinc-100 shadow-inner">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium leading-none mb-0.5">
              CH
            </span>
            <span className="leading-none text-base">
              {chapter.chapter_number}
            </span>
          </div>

          <div className="min-w-0 flex-1 shared-info-layout">
            <h3 className="truncate text-sm font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors">
              {chapter.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-400">
              <span className="font-medium text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded-md">
                {chapter.total_pages} Pages
              </span>
              <span className="text-zinc-600">•</span>
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

      {/* Right */}
      <div
        className={`flex items-center gap-3 transition-all duration-200 ${
          isOrderingMode
            ? "pointer-events-none translate-x-4 opacity-0 invisible"
            : "translate-x-0 opacity-100 visibility-visible"
        }`}
      >
        {/* Badge Censorship */}
        <span className="hidden rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-300 shadow-sm shadow-emerald-500/10 sm:block">
          {chapter.censorship?.name || "Unknown"}
        </span>

        {/* Thumbnail Button */}
        <button
          onClick={() => setSelectedChapter(chapter)}
          className="group/btn flex h-12 items-center gap-2 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/10 hover:text-white"
        >
          <ImageIcon className="h-4 w-4 text-zinc-400 transition group-hover/btn:scale-110 group-hover/btn:text-fuchsia-400" />
          <span>Thumbnail</span>
        </button>

        {/* Read Button */}
        <Link
          href={`/comic/${comicId}/chapter/${chapter.id}`}
          className="group/btn flex h-12 items-center gap-2 rounded-2xl bg-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:bg-indigo-500 hover:text-white"
        >
          <BookOpen className="h-4 w-4 transition group-hover/btn:scale-110" />
          <span>Read Chapter</span>
        </Link>
      </div>
    </div>
  );
}
