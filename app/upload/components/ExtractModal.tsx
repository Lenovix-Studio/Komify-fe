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

interface ExtractModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractUrls: string[];
  setExtractUrls: React.Dispatch<React.SetStateAction<string[]>>;
  onExtract: () => void;
  isExtracting: boolean;
}

export function ExtractModal({
  isOpen,
  onClose,
  extractUrls,
  setExtractUrls,
  onExtract,
  isExtracting,
}: ExtractModalProps) {
  const addUrl = () => {
    setExtractUrls((prev) => [...prev, ""]);
  };

  const removeUrl = (index: number) => {
    setExtractUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const updateUrl = (index: number, value: string) => {
    setExtractUrls((prev) => {
      const newUrls = [...prev];
      newUrls[index] = value;
      return newUrls;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-3xl border border-zinc-100 bg-white p-0 shadow-[0_20px_50px_rgba(0,0,0,0.06)] gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="border-b border-zinc-100 px-6 py-5 text-left">
          <DialogTitle className="text-xl font-bold text-zinc-900 tracking-tight">
            Extract Comic Metadata
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-zinc-500">
            Paste source URLs to automatically extract comic information.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4 px-6 py-5 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-zinc-700">
              Source URLs
            </Label>
            <div className="space-y-3">
              {extractUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => updateUrl(i, e.target.value)}
                    placeholder="https://example.com/comic/123"
                    className="flex-1 h-auto rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus-visible:border-indigo-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-indigo-500/10"
                  />
                  {extractUrls.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeUrl(i)}
                      className="h-11 w-11 shrink-0 rounded-2xl text-zinc-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addUrl}
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
