"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  SensorDescriptor,
  SensorOptions,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { SortablePageCard } from "./SortablePageCard";
import { TempPage } from "@/types/uploadPage";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface UploadPagesModalProps {
  activeUploadChapterId: string | null;
  tempPages: TempPage[];
  setTempPages: React.Dispatch<React.SetStateAction<TempPage[]>>;
  sensorsPages: SensorDescriptor<SensorOptions>[];
  handleDragEndPages: (event: any) => void;
  cancelUploadedPages: () => void;
  saveUploadedPages: () => void;
  removeSingleTempPage: (index: number) => void;
  handleAppendPages: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadPagesModal({
  activeUploadChapterId,
  tempPages,
  setTempPages,
  sensorsPages,
  handleDragEndPages,
  cancelUploadedPages,
  saveUploadedPages,
  removeSingleTempPage,
  handleAppendPages,
}: UploadPagesModalProps) {
  const isOpen = !!activeUploadChapterId;

  const handleClearAll = () => {
    tempPages.forEach((p) => URL.revokeObjectURL(p.url));
    setTempPages([]);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && cancelUploadedPages()}
    >
      <DialogContent className="max-w-[95vw] md:max-w-[90vw] p-0 overflow-hidden flex flex-col h-[85vh] bg-background border shadow-2xl gap-0">
        {/* ================= HEADER ================= */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-card px-5 py-4 shrink-0">
          {/* Left Action */}
          <div className="w-24">
            {tempPages.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
                className="h-8 text-xs font-semibold text-white"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Center */}
          <DialogHeader className="flex-1 text-center space-y-0.5">
            <DialogTitle className="text-sm font-bold text-foreground">
              Confirm Upload
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {tempPages.length} selected pages
            </DialogDescription>
          </DialogHeader>

          {/* Right */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={cancelUploadedPages}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={saveUploadedPages}
              className="text-xs font-semibold shadow-sm"
            >
              Save Pages
            </Button>
          </div>
        </div>

        {/* ================= BODY / AREA DROP & SORT ================= */}
        <div className="flex-1 overflow-y-auto p-5 bg-muted/20">
          <DndContext
            sensors={sensorsPages}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEndPages}
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              <SortableContext
                items={tempPages.map((p) => p.id)}
                strategy={rectSortingStrategy}
              >
                {tempPages.map((file, idx) => (
                  <SortablePageCard
                    key={file.id}
                    file={file}
                    idx={idx}
                    onRemove={() => removeSingleTempPage(idx)}
                  />
                ))}
              </SortableContext>

              {/* Add Pages Button Slot */}
              <label
                htmlFor="modal-file-append-input"
                className="group flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background transition-all hover:border-primary hover:bg-muted/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/50 transition-colors group-hover:border-primary/50 group-hover:bg-primary/10">
                  <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </div>

                <div className="text-center">
                  <p className="text-xs font-semibold text-foreground group-hover:text-primary">
                    Add Pages
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    JPG / PNG / ZIP
                  </p>
                </div>

                <input
                  type="file"
                  id="modal-file-append-input"
                  accept="image/*,.pdf"
                  className="hidden"
                  multiple
                  onChange={handleAppendPages}
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = "";
                  }}
                />
              </label>
            </div>
          </DndContext>
        </div>
      </DialogContent>
    </Dialog>
  );
}
