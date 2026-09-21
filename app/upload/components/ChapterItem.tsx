"use client";

import React from "react";
import {
  GripVertical,
  Trash2,
  Upload,
  ImageIcon,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Chapter, OptionItem } from "@/types/uploadPage";

interface ChapterItemProps {
  chapter: Chapter;
  dragHandleProps?: any;
  censorships: OptionItem[];
  languages: OptionItem[];
  updateChapter: (id: string, field: keyof Chapter, value: any) => void;
  removeChapter: (id: string) => void;
  handlePagesChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string,
  ) => void;
  handleOpenPreview: (id: string, pages: any[]) => void;
}

export const ChapterItem: React.FC<ChapterItemProps> = ({
  chapter,
  dragHandleProps,
  censorships,
  languages,
  updateChapter,
  removeChapter,
  handlePagesChange,
  handleOpenPreview,
}) => {
  return (
    <Card className="rounded-2xl border border-border/80 bg-background shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              {...dragHandleProps}
              className="h-9 w-9 cursor-grab rounded-xl text-muted-foreground hover:text-primary active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
              <span className="sr-only">Drag chapter</span>
            </Button>

            {/* Chapter Number */}
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Chapter
              </Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={chapter.main}
                  onChange={(e) =>
                    updateChapter(chapter.id, "main", Number(e.target.value))
                  }
                  className="h-9 w-14 rounded-xl bg-muted/40 px-2 text-center text-sm font-semibold text-primary"
                />
                <span className="font-bold text-muted-foreground">.</span>
                <Input
                  type="number"
                  value={chapter.sub}
                  onChange={(e) =>
                    updateChapter(chapter.id, "sub", Number(e.target.value))
                  }
                  className="h-9 w-14 rounded-xl bg-muted/40 px-2 text-center text-sm font-semibold text-primary"
                />
              </div>
            </div>
          </div>

          {/* Delete Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeChapter(chapter.id)}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove chapter</span>
          </Button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {/* Chapter Title */}
          <div className="space-y-1.5 sm:col-span-2 md:col-span-2">
            <Label className="text-xs font-medium">Chapter Title</Label>
            <Input
              type="text"
              placeholder="Chapter Title"
              value={chapter.title}
              onChange={(e) =>
                updateChapter(chapter.id, "title", e.target.value)
              }
              className="h-10 rounded-xl bg-muted/30"
            />
          </div>

          {/* Censorship */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Censorship</Label>
            <Select
              value={
                chapter.censorship_id
                  ? String(chapter.censorship_id).trim().toLowerCase()
                  : ""
              }
              onValueChange={(value) =>
                updateChapter(chapter.id, "censorship_id", value || "")
              }
            >
              <SelectTrigger className="h-10 w-full rounded-xl bg-muted/30">
                <SelectValue>
                  {censorships.find(
                    (c) =>
                      String(c.id).trim().toLowerCase() ===
                      String(chapter.censorship_id).trim().toLowerCase(),
                  )?.name || "Select censorship"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {censorships.map((censorship) => (
                  <SelectItem
                    key={censorship.id || censorship.name}
                    value={
                      censorship.id
                        ? String(censorship.id).trim().toLowerCase()
                        : ""
                    }
                  >
                    {censorship.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Language</Label>
            <Select
              value={
                chapter.language
                  ? String(chapter.language).trim().toLowerCase()
                  : ""
              }
              onValueChange={(value) =>
                updateChapter(chapter.id, "language", value || "")
              }
            >
              <SelectTrigger className="h-10 w-full rounded-xl bg-muted/30">
                <SelectValue>
                  {languages.find(
                    (l) =>
                      String(l.code).trim().toLowerCase() ===
                      String(chapter.language).trim().toLowerCase(),
                  )?.name || "Select language"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {languages.map((language) => (
                  <SelectItem
                    key={language.code || language.name}
                    value={
                      language.code
                        ? String(language.code).trim().toLowerCase()
                        : ""
                    }
                  >
                    {language.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload Section */}
          {chapter.pages.length === 0 ? (
            <label
              htmlFor={`input-file-chapter-${chapter.id}`}
              className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary sm:col-span-2 md:col-span-4"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground shadow-sm transition-colors group-hover:border-primary/30 group-hover:text-primary">
                <Upload className="h-4 w-4" />
              </div>
              <div className="text-center">
                <span className="block text-xs font-semibold text-foreground">
                  Upload Chapter Pages
                </span>
                <span className="text-[10px] text-muted-foreground">
                  JPG, PNG or PDF • Click to browse
                </span>
              </div>
              <input
                type="file"
                id={`input-file-chapter-${chapter.id}`}
                accept="image/*,.pdf"
                className="hidden"
                multiple
                onChange={(e) => handlePagesChange(e, chapter.id)}
                onClick={(e) => {
                  (e.target as HTMLInputElement).value = "";
                }}
              />
            </label>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:col-span-2 md:col-span-4">
              {/* Loaded Information */}
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-background text-primary shadow-sm">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-foreground">
                    Pages Loaded Successfully
                  </p>
                  <p className="text-[10px] font-medium text-primary">
                    {chapter.pages.length}{" "}
                    {chapter.pages.length === 1 ? "image" : "images"} ready
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenPreview(chapter.id, chapter.pages)}
                  className="h-9 rounded-xl px-3 text-xs"
                >
                  Manage
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  asChild
                  className="h-9 w-9 rounded-xl"
                >
                  <label
                    htmlFor={`replace-file-chapter-${chapter.id}`}
                    className="cursor-pointer"
                    title="Replace all files"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <input
                      type="file"
                      id={`replace-file-chapter-${chapter.id}`}
                      accept="image/*,.pdf"
                      className="hidden"
                      multiple
                      onChange={(e) => handlePagesChange(e, chapter.id)}
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = "";
                      }}
                    />
                  </label>
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
