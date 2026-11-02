"use client";

import React, { useState } from "react";
import { BACKEND_URL } from "@/lib/constant";
import { X, Check } from "lucide-react";

export interface ChapterPageItem {
  id: string;
  page_number: number;
  filepath: string;
  filename: string;
}

export interface ChapterItemData {
  id: string;
  title: string;
  chapter_number: string;
  total_pages: number;
  pages: ChapterPageItem[];
}

export interface SelectChapterCoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: ChapterItemData[];
  onSelectPage: (imageUrl: string) => void;
}

export function SelectChapterCoverModal({
  isOpen,
  onClose,
  chapters,
  onSelectPage,
}: SelectChapterCoverModalProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    chapters[0]?.id || "",
  );

  if (!isOpen) return null;

  const currentChapter =
    chapters.find((c) => c.id === selectedChapterId) || chapters[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative flex max-h-[85vh] w-full max-w-4xl flex-col rounded-3xl border border-border/80 bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Pilih Gambar dari Chapter
            </h2>
            <p className="text-xs text-muted-foreground">
              Pilih halaman yang ingin dijadikan cover komik
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Chapter Selector Tab / Dropdown */}
        {chapters.length > 0 && (
          <div className="flex items-center gap-2 border-b border-border/60 px-6 py-3 overflow-x-auto">
            <span className="text-xs font-semibold text-muted-foreground shrink-0">
              Chapter:
            </span>
            <div className="flex gap-2">
              {chapters.map((ch) => {
                const isActive = (currentChapter?.id || "") === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSelectedChapterId(ch.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "border border-border/80 bg-background text-foreground hover:bg-accent"
                    }`}
                  >
                    Ch. {ch.chapter_number}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Pages Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {!currentChapter ||
          !currentChapter.pages ||
          currentChapter.pages.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Tidak ada halaman pada chapter ini
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {currentChapter.pages.map((page) => {
                const imgUrl = `${BACKEND_URL}${page.filepath}`;
                return (
                  <div
                    key={page.id}
                    onClick={() => {
                      onSelectPage(imgUrl);
                      onClose();
                    }}
                    className="group relative aspect-2/3 cursor-pointer overflow-hidden rounded-2xl border border-border/80 bg-muted/40 shadow-xs transition-all hover:border-primary hover:shadow-md"
                  >
                    <img
                      src={imgUrl}
                      alt={`Page ${page.page_number}`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm">
                        <Check className="h-3.5 w-3.5" />
                        Pilih Cover
                      </span>
                    </div>
                    <span className="absolute bottom-2 left-2 rounded-lg bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                      Hal. {page.page_number}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
