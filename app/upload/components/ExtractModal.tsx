"use client";

import React from "react";
import { Sparkles, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ExtractItem {
  url: string;
  main: number;
  sub: number;
  title: string;
}

interface ExtractModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractItems: ExtractItem[];
  setExtractItems: React.Dispatch<React.SetStateAction<ExtractItem[]>>;
  onExtract: () => void;
  isExtracting: boolean;
}

export function ExtractModal({
  isOpen,
  onClose,
  extractItems,
  setExtractItems,
  onExtract,
  isExtracting,
}: ExtractModalProps) {
  const addItem = () => {
    setExtractItems((prev) => {
      const nextMain = prev.length > 0 ? prev[prev.length - 1].main + 1 : 1;
      return [
        ...prev,
        {
          url: "",
          main: nextMain,
          sub: 0,
          title: "",
        },
      ];
    });
  };

  const removeItem = (index: number) => {
    setExtractItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ExtractItem, value: any) => {
    setExtractItems((prev) => {
      const newItems = [...prev];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
      return newItems;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl rounded-3xl border border-zinc-100 bg-white p-0 shadow-[0_20px_50px_rgba(0,0,0,0.06)] gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="border-b border-zinc-100 px-6 py-5 text-left">
          <DialogTitle className="text-xl font-bold text-zinc-900 tracking-tight">
            Extract Comic Metadata
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-zinc-500">
            Paste source URLs and specify chapter details to automatically
            extract comic information.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4 px-6 py-5 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-zinc-700">
              Source URLs & Chapter Details
            </Label>

            <div className="space-y-3.5">
              {extractItems.map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 space-y-2.5 transition-all focus-within:border-indigo-400 focus-within:bg-white"
                >
                  {/* Top row: Chapter Main.Sub + Chapter Title + Delete Button */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-semibold text-zinc-600">
                        Ch
                      </span>
                      <Input
                        type="number"
                        min="0"
                        value={item.main}
                        onChange={(e) =>
                          updateItem(i, "main", Number(e.target.value))
                        }
                        className="h-10 w-16 rounded-xl border border-zinc-200 bg-white px-2 text-center text-sm font-bold text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                      />
                      <span className="font-bold text-zinc-400">.</span>
                      <Input
                        type="number"
                        min="0"
                        value={item.sub}
                        onChange={(e) =>
                          updateItem(i, "sub", Number(e.target.value))
                        }
                        className="h-10 w-14 rounded-xl border border-zinc-200 bg-white px-2 text-center text-sm font-bold text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                      />
                    </div>

                    <Input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItem(i, "title", e.target.value)}
                      placeholder="Chapter Title (Optional)"
                      className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                    />

                    {extractItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(i)}
                        className="h-10 w-10 shrink-0 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50"
                        title="Remove URL"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Bottom row: URL input with fixed height */}
                  <div>
                    <Input
                      type="url"
                      value={item.url}
                      onChange={(e) => updateItem(i, "url", e.target.value)}
                      placeholder="https://example.com/comic/123"
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="w-full mt-2 h-11 rounded-2xl border-dashed border-2 border-zinc-200 text-zinc-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add URL
            </Button>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex flex-row justify-end gap-3 border-t border-zinc-100 px-6 py-5 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-2xl border border-zinc-200 bg-white px-5 h-11 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 shadow-none"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={onExtract}
            disabled={isExtracting}
            className="
              flex items-center gap-2 rounded-2xl
              bg-indigo-600 px-5 h-11
              text-sm font-semibold text-white
              transition hover:bg-indigo-700 active:scale-[0.98]
              disabled:opacity-50
              shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20
            "
          >
            <Sparkles className="h-4 w-4" />
            {isExtracting ? "Extracting..." : "Extract"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
