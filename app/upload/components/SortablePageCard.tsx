"use client";

import { useSortable } from "@dnd-kit/sortable";
import { TempPage } from "@/types/uploadPage";
import { Trash2, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SortablePageCardProps {
  file: TempPage;
  idx: number;
  onRemove: () => void;
}

export function SortablePageCard({
  file,
  idx,
  onRemove,
}: SortablePageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: file.id,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${isDragging ? 1.02 : 1})`
      : undefined,
    transition: transition || undefined,
    willChange: "transform" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative aspect-[3/4] overflow-hidden rounded-xl border bg-muted/30 transition-all duration-200 ${
        isDragging
          ? "z-50 border-primary bg-background shadow-lg ring-2 ring-primary/10"
          : "border-border hover:border-muted-foreground/50 hover:shadow-md"
      }`}
    >
      {/* Drag Handle */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        {...attributes}
        {...listeners}
        className="absolute left-2 bottom-2 z-10 h-8 w-8 cursor-grab bg-background/80 backdrop-blur-sm active:cursor-grabbing shadow-sm"
      >
        <GripHorizontal className="h-4 w-4 text-muted-foreground" />
      </Button>

      {/* Page Badge */}
      <Badge
        variant="secondary"
        className="absolute left-2 top-2 z-10 bg-background/90 backdrop-blur-sm border text-[11px] font-medium shadow-sm pointer-events-none"
      >
        Page {idx + 1}
      </Badge>

      {/* Remove Button */}
      <Button
        type="button"
        variant="destructive"
        size="icon"
        onClick={onRemove}
        className="absolute right-2 top-2 z-10 h-8 w-8 opacity-0 transition-opacity duration-200 group-hover:opacity-100 shadow-sm"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Image Container */}
      <img
        src={file.url}
        alt={file.name || `Comic Page ${idx + 1}`}
        className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.01]"
      />

      {/* Overlay Mask Ringan */}
      <div className="pointer-events-none absolute inset-0 bg-foreground/[0.01] opacity-0 transition group-hover:opacity-100" />
    </div>
  );
}
