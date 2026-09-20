"use client";

import React from "react";
import { Sparkles } from "lucide-react";
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
  extractUrl: string;
  setExtractUrl: (url: string) => void;
  onExtract: () => void;
  isExtracting: boolean;
}

export function ExtractModal({
  isOpen,
  onClose,
  extractUrl,
  setExtractUrl,
  onExtract,
  isExtracting,
}: ExtractModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-3xl border border-zinc-100 bg-white p-0 shadow-[0_20px_50px_rgba(0,0,0,0.06)] gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="border-b border-zinc-100 px-6 py-5 text-left">
          <DialogTitle className="text-xl font-bold text-zinc-900 tracking-tight">
            Extract Comic Metadata
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-zinc-500">
            Paste source URL to automatically extract comic information.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-2 px-6 py-5">
          <Label
            htmlFor="source-url"
            className="text-sm font-semibold text-zinc-700"
          >
            Source URL
          </Label>
          <Input
            id="source-url"
            type="url"
            value={extractUrl}
            onChange={(e) => setExtractUrl(e.target.value)}
            placeholder="https://example.com/comic/123"
            className="w-full h-auto rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus-visible:border-indigo-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:ring-offset-0"
          />
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
