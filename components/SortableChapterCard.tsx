"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Pencil,
  Image as ImageIcon,
  BookOpen,
} from "lucide-react";
import { ComicChapter } from "@/types/detailPage";

export interface SortableChapterCardProps {
  chapter: ComicChapter;
  comicId: string;
  isOrderingMode: boolean;
  setSelectedChapter: (chapter: ComicChapter | null) => void;
}

export function SortableChapterCard({
  chapter,
  comicId,
  isOrderingMode,
  setSelectedChapter,
}: SortableChapterCardProps) {
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

      {/* Right */}
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
          type="button"
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
