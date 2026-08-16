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
    <div className="min-h-screen bg-black text-white">
      {/* Top Reader Bar */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-black/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            {/* Back */}
            <Link
              href={`/comic/${slug}`}
              className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-zinc-300 transition hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
            </Link>

            {/* Title */}
            <div className="min-w-0">
              <p className="line-clamp-1 text-sm font-semibold text-white">
                {chapter.title || `Chapter ${chapter.chapter_number}`}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span>Chapter {chapter.chapter_number}</span>

                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span>Total Pages: {chapter.total_pages}</span>

                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span>{chapter.language.name}</span>

                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span>{chapter.censorship.name}</span>
              </div>
            </div>
          </div>

          {/* tambahkan tombol link ke halaman edit chapternya */}
          <Link
            href={`/comic/${slug}/chapter/${chapterId}/edit`}
            className="flex items-center gap-2 rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
          >
            <Pencil className="h-4 w-4" />
            Edit Chapter
          </Link>
        </div>
      </header>

      {/* Reader */}
      <main className="mx-auto flex max-w-5xl flex-col items-center px-4 py-6">
        {/* Reader Pages */}
        <div
          className={`w-full ${getZoomClass()} mx-auto space-y-4 transition-all duration-300`}
        >
          {chapter.pages.map((page) => (
            <div
              key={page.id}
              className="group relative overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950 shadow-2xl"
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

              {/* Hover Overlay */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/80 to-transparent px-5 py-4 opacity-0 transition duration-200 group-hover:opacity-100">
                <p className="text-sm font-medium text-white">
                  Page {page.page_number}
                </p>
                <p className="text-xs text-zinc-400">{page.filename}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Navigation */}
        <div className="fixed right-6 bottom-6 z-50">
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 p-1.5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center">
              {/* Zoom Out */}
              <button
                onClick={() => setZoom((prev) => Math.max(60, prev - 20))}
                disabled={zoom <= 60}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition-all ${
                  zoom > 60
                    ? "hover:bg-zinc-800 hover:text-white"
                    : "cursor-not-allowed opacity-30"
                }`}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              {/* Indikator Persentase Zoom */}
              <span className="w-12 text-center text-[11px] font-semibold tracking-wide text-zinc-400 select-none">
                {zoom}%
              </span>

              {/* Zoom In */}
              <button
                onClick={() => setZoom((prev) => Math.min(100, prev + 20))}
                disabled={zoom >= 100}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition-all ${
                  zoom < 100
                    ? "hover:bg-zinc-800 hover:text-white"
                    : "cursor-not-allowed opacity-30"
                }`}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* SEPARATOR LINE */}
            <div className="h-5 w-px bg-zinc-800 mx-1" />

            <div className="flex items-center gap-1.5">
              {/* Prev Chapter */}
              <button
                onClick={goPrevChapter}
                disabled={!prevChapter}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition-all ${
                  prevChapter
                    ? "hover:bg-zinc-800 hover:text-white"
                    : "cursor-not-allowed opacity-30"
                }`}
                title="Previous Chapter"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Chapter Input Box */}
              <div className="flex items-center gap-1.5 rounded-full bg-zinc-800/50 px-3.5 py-1.5 border border-zinc-800/40 focus-within:border-indigo-500/50 transition-all">
                <span className="text-[11px] font-medium text-zinc-500 select-none uppercase tracking-wider">
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
                  className="w-10 bg-transparent text-center text-sm font-bold text-zinc-100 outline-none placeholder-zinc-600"
                />
              </div>

              {/* Next Chapter */}
              <button
                onClick={goNextChapter}
                disabled={!nextChapter}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                  nextChapter
                    ? "bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 shadow-md shadow-indigo-600/20"
                    : "cursor-not-allowed bg-zinc-800/50 text-zinc-600 opacity-40"
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
