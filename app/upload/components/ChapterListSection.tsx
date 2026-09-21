"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  SensorDescriptor,
  SensorOptions,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CardContent } from "@/components/ui/card";
import { Chapter, OptionItem } from "@/types/uploadPage";
import { ChapterItem } from "./ChapterItem";
import { SortableChapter } from "./SortableChapter";

interface ChapterListSectionProps {
  sensors: SensorDescriptor<SensorOptions>[];
  sortedChapters: Chapter[];
  censorships: OptionItem[];
  languages: OptionItem[];
  handleDragEnd: (event: DragEndEvent) => void;
  updateChapter: (id: string, field: keyof Chapter, value: any) => void;
  removeChapter: (id: string) => void;
  handlePagesChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string,
  ) => void;
  handleOpenPreview: (id: string, pages: any[]) => void;
}

export const ChapterListSection: React.FC<ChapterListSectionProps> = ({
  sensors,
  sortedChapters,
  censorships,
  languages,
  handleDragEnd,
  updateChapter,
  removeChapter,
  handlePagesChange,
  handleOpenPreview,
}) => {
  return (
    <CardContent className="p-6 pt-0">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedChapters.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {sortedChapters.map((chapter) => (
              <SortableChapter key={chapter.id} chapter={chapter}>
                {({ dragHandleProps }: any) => (
                  <ChapterItem
                    chapter={chapter}
                    dragHandleProps={dragHandleProps}
                    censorships={censorships}
                    languages={languages}
                    updateChapter={updateChapter}
                    removeChapter={removeChapter}
                    handlePagesChange={handlePagesChange}
                    handleOpenPreview={handleOpenPreview}
                  />
                )}
              </SortableChapter>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </CardContent>
  );
};

export default ChapterListSection;
