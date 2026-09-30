"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RotatableImage } from "@/components/RotatableImage";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Loading } from "@/components/loading";
import { toast } from "sonner";
import { BACKEND_URL } from "@/lib/constant";
import { ChapterDetail } from "@/types/chapterPage";

export default function ChapterReaderContent({
  slug,
  chapterId,
  initialChapter,
  initialAllChapters,
}: {
  slug: string;
  chapterId: string;
  initialChapter: ChapterDetail;
  initialAllChapters: { id: string; chapter_number: string }[];
}) {
  const router = useRouter();
  const [chapter, setChapter] = useState(initialChapter);
  useEffect(() => {
    setChapter(initialChapter);
  }, [initialChapter]);

  const allChapters = initialAllChapters;
  const [zoom, setZoom] = useState(80);
  const [viewMode, setViewMode] = useState<"original" | "translated">(
    "original",
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [rotations, setRotations] = useState<Record<string, number>>({});
  const [chapterInput, setChapterInput] = useState(
    initialChapter.chapter_number,
  );

  const handleRotate = (id: string) => {
    setRotations((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) + 90) % 360,
    }));
  };

  const handleTranslate = async () => {
    try {
      setIsTranslating(true);
      toast.info("Memulai proses terjemahan (AI) di latar belakang...");

      const res = await fetch(
        `${BACKEND_URL}/chapters/${chapterId}/translate`,
        {
          method: "POST",
        },
      );

      if (!res.ok) throw new Error("Gagal memulai terjemahan");

      toast.success(
        "Terjemahan sedang berjalan! Silakan refresh beberapa saat lagi.",
      );
    } catch (error) {
      console.error(error);
      toast.error("Gagal memulai terjemahan");
    } finally {
      setIsTranslating(false);
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });

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
      toast.error("Chapter not found");
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
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-500 px-4 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-600 disabled:opacity-50"
            >
              {isTranslating ? "Proses..." : "Translate AI"}
            </button>
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
                <RotatableImage
                  src={`${BACKEND_URL}${
                    viewMode === "translated" &&
                    (page as any).translated_filepath
                      ? (page as any).translated_filepath
                      : page.filepath
                  }`}
                  alt={`Page ${page.page_number}`}
                  rotation={rotations[page.id] || 0}
                  className="h-auto w-full transition-opacity duration-300"
                />

                <div className="absolute top-4 right-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-10">
                  <button
                    onClick={() => handleRotate(page.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-colors shadow-lg border border-white/10"
                    title="Rotate Image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  </button>
                </div>
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

        <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-3">
          <div className="flex flex-col items-center gap-1.5 rounded-full border border-border/80 bg-card/90 p-1.5 shadow-lg backdrop-blur-md">
            <button
              onClick={scrollToTop}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
              title="Scroll to Top"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
            </button>
            <div className="w-6 h-px bg-border/80" />
            <button
              onClick={scrollToBottom}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
              title="Scroll to Bottom"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-card/90 p-1.5 shadow-lg backdrop-blur-md">
            <button
              onClick={() => setViewMode("original")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                viewMode === "original"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setViewMode("translated")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                viewMode === "translated"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              Translated
            </button>
          </div>
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
