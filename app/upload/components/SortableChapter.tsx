"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Chapter } from "@/types/uploadPage";

interface SortableChapterProps {
  chapter: Chapter;
  children: (props: {
    dragHandleProps: React.HTMLAttributes<HTMLButtonElement> &
      React.HTMLAttributes<HTMLDivElement>;
  }) => React.ReactNode;
}

export function SortableChapter({ chapter, children }: SortableChapterProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: chapter.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-all duration-200 ${
        isDragging
          ? "opacity-40 scale-[0.98] ring-1 ring-border/50 rounded-xl bg-muted/20"
          : ""
      }`}
    >
      {children({
        dragHandleProps: {
          ...attributes,
          ...listeners,
        },
      })}
    </div>
  );
}
