"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Loading } from "@/components/loading";

type ChapterPage = {
  id: string;
  filename: string;
  filepath: string;
  page_number: number;
  width: number | null;
  height: number | null;
};

type ChapterDetail = {
  id: string;

  comic: {
    id: string;
    title: string;
    legacy_id: number;
  };

  title: string;
  chapter_number: string;
  total_pages: number;

  published_at: string | null;

  language: {
    code: string;
    name: string;
  };

  censorship: {
    id: string;
    name: string;
  };

  pages: ChapterPage[];
};

export default function ChapterReaderPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const chapterId = params.chapter as string;
  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [allChapters, setAllChapters] = useState<
    {
      id: string;
      chapter_number: string;
    }[]
  >([]);
  const [chapterInput, setChapterInput] = useState("");
  const [zoom, setZoom] = useState(80);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        setLoading(true);

        const data: ChapterDetail = await getChapter(chapterId);
        setChapter(data);
        setChapterInput(data.chapter_number);

        const chaptersResponse = await getComicChapters(slug);
        setAllChapters(
          chaptersResponse.data.map((c: any) => ({
            id: c.id,
            chapter_number: c.chapter_number,
          })),
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (chapterId) {
      fetchChapter();
    }
  }, [chapterId]);

  const sortedChapters = [...allChapters].sort(
    (a, b) => Number(a.chapter_number) - Number(b.chapter_number),
  );
  const currentIndex = sortedChapters.findIndex((c) => c.id === chapterId);
  const prevChapter =
    currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < sortedChapters.length - 1
      ? sortedChapters[currentIndex + 1]
      : null;

  const goPrevChapter = () => {
    if (!prevChapter) return;

    router.push(`/comic/${slug}/chapter/${prevChapter.id}`);
  };
  const goNextChapter = () => {
    if (!nextChapter) return;

    router.push(`/comic/${slug}/chapter/${nextChapter.id}`);
  };
  const jumpToChapter = () => {
    const found = allChapters.find(
      (c) => c.chapter_number === chapterInput.trim(),
    );

    if (!found) {
      alert("Chapter not found");
      return;
    }

    router.push(`/comic/${slug}/chapter/${found.id}`);
  };

  const getZoomClass = () => {
    if (zoom === 60) return "max-w-2xl";
    if (zoom === 100) return "max-w-5xl";
    return "max-w-4xl";
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Sembunyikan jika scroll ke bawah > 80px, tampilkan jika scroll ke atas
      if (currentScrollY > 80 && currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loading text="Loading chapter..." />
      </main>
    );
  }

  if (!chapter) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        Chapter not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Reader Bar */}
      <header
        className={`sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-md transition-transform duration-300 supports-backdrop-filter:bg-background/60 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Left Side: Navigation & Info */}
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link
              href={`/comic/${slug}`}
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-card text-muted-foreground transition-all hover:border-primary/50 hover:bg-accent hover:text-foreground shadow-xs"
              aria-label="Kembali ke komik"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </Link>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
                {chapter.title || `Chapter ${chapter.chapter_number}`}
              </h1>

              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">
                  Ch. {chapter.chapter_number}
                </span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>{chapter.total_pages} Hal</span>

                {chapter.language?.name && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{chapter.language.name}</span>
                  </>
                )}

                {chapter.censorship?.name && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {chapter.censorship.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Action Button */}
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/comic/${slug}/chapter/${chapterId}/edit`}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Chapter</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col items-center px-4 py-6">
        <div
          className={`w-full ${getZoomClass()} mx-auto space-y-4 transition-all duration-300`}
        >
          {chapter.pages.map((page) => (
            <div
              key={page.id}
              className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm"
            >
              <div className="relative">
                <Image
                  src={`${baseUrl}${page.filepath}`}
                  alt={`Page ${page.page_number}`}
                  width={1200}
                  height={1800}
                  className="h-auto w-full"
                  loading="lazy"
                  unoptimized
                />
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/75 via-black/40 to-transparent px-5 py-4 opacity-0 transition duration-200 group-hover:opacity-100">
                <p className="text-sm font-medium text-white">
                  Page {page.page_number}
                </p>
                <p className="text-xs text-white/80">{page.filename}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="fixed right-6 bottom-6 z-50">
          <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-card/90 p-1.5 shadow-lg backdrop-blur-md">
            <div className="flex items-center">
              <button
                onClick={() => setZoom((prev) => Math.max(60, prev - 20))}
                disabled={zoom <= 60}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all ${
                  zoom > 60
                    ? "hover:bg-accent hover:text-foreground"
                    : "cursor-not-allowed opacity-30"
                }`}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              <span className="w-12 text-center text-[11px] font-semibold tracking-wide text-muted-foreground select-none">
                {zoom}%
              </span>

              <button
                onClick={() => setZoom((prev) => Math.min(100, prev + 20))}
                disabled={zoom >= 100}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all ${
                  zoom < 100
                    ? "hover:bg-accent hover:text-foreground"
                    : "cursor-not-allowed opacity-30"
                }`}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            <div className="h-5 w-px bg-border/80 mx-1" />

            <div className="flex items-center gap-1.5">
              <button
                onClick={goPrevChapter}
                disabled={!prevChapter}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all ${
                  prevChapter
                    ? "hover:bg-accent hover:text-foreground"
                    : "cursor-not-allowed opacity-30"
                }`}
                title="Previous Chapter"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3.5 py-1.5 border border-border/60 focus-within:border-primary/50 transition-all">
                <span className="text-[11px] font-medium text-muted-foreground select-none uppercase tracking-wider">
                  Ch
                </span>
                <input
                  type="text"
                  value={chapterInput}
                  onChange={(e) => setChapterInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      jumpToChapter();
                    }
                  }}
                  className="w-10 bg-transparent text-center text-sm font-bold text-foreground outline-none placeholder-muted-foreground/60"
                />
              </div>

              <button
                onClick={goNextChapter}
                disabled={!nextChapter}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                  nextChapter
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-xs"
                    : "cursor-not-allowed bg-muted text-muted-foreground opacity-40"
                }`}
                title="Next Chapter"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

async function getComicChapters(comicId: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  const response = await fetch(`${baseUrl}/comics/${comicId}/chapters`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch chapters");
  }

  return response.json();
}
async function getChapter(chapterId: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  const response = await fetch(`${baseUrl}/chapters/${chapterId}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch chapter");
  }

  return response.json();
}
