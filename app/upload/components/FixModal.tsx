"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FixModalData {
  open: boolean;
  field: string;
  value: string;
  preview: string;
}

interface FixModalProps {
  modalData: FixModalData;
  setModalData: React.Dispatch<React.SetStateAction<FixModalData>>;
  onSave: () => void;
  onFixParagraph: (text: string) => string;
}

export function FixModal({
  modalData,
  setModalData,
  onSave,
  onFixParagraph,
}: FixModalProps) {
  const handleClose = () => {
    setModalData({
      open: false,
      field: "",
      value: "",
      preview: "",
    });
  };

  return (
    <Dialog
      open={modalData.open}
      onOpenChange={(open) => !open && handleClose()}
    >
      <DialogContent className="sm:max-w-2xl rounded-3xl border border-zinc-100 bg-white p-0 shadow-[0_20px_50px_rgba(0,0,0,0.06)] gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="border-b border-zinc-100 px-6 py-5 text-left">
          <DialogTitle className="text-xl font-bold text-zinc-900 tracking-tight">
            Fix {modalData.field}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-zinc-500">
            Clean and normalize metadata automatically
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-5 p-6">
          {/* Raw Input */}
          <div className="space-y-2">
            <Label
              htmlFor="raw-input"
              className="block text-xs font-bold uppercase tracking-[0.15em] text-zinc-400"
            >
              Raw Input
            </Label>
            <Textarea
              id="raw-input"
              value={modalData.value}
              onChange={(e) =>
                setModalData((prev) => ({
                  ...prev,
                  value: e.target.value,
                  preview: onFixParagraph(e.target.value),
                }))
              }
              rows={6}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus-visible:border-indigo-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:ring-offset-0 resize-none"
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="block text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
              Preview Result
            </Label>
            <div className="min-h-[120px] whitespace-pre-wrap rounded-2xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 text-sm leading-relaxed text-indigo-950 font-medium">
              {modalData.preview || (
                <span className="text-zinc-400 font-normal italic">
                  No preview generated
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex flex-row gap-3 border-t border-zinc-100 p-5 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1 rounded-2xl border border-zinc-200 bg-white py-6 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 shadow-none"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={onSave}
            className="flex-1 rounded-2xl bg-indigo-600 py-6 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-600/10"
          >
            Save Metadata
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
