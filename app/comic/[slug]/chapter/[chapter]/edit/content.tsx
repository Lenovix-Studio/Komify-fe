"use client";
import { extractFileViaScraper } from "@/lib/server-extractor";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Save,
  BookOpen,
  ImageIcon,
  Trash2,
  GripVertical,
  Plus,
  RefreshCcw,
} from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import { BACKEND_URL } from "@/lib/constant";
import { ChapterResponse, EditablePage } from "@/types/chapterPage";

type SortablePageCardProps = {
  page: EditablePage;
  onDelete: (id: string) => void;
  onReplace: (id: string, file: File) => void;
};

export default function ChapterEditContent({
  slug,
  chapterId,
  initialChapterData,
  languages,
  censorships,
}: {
  slug: string;
  chapterId: string;
  initialChapterData: any;
  languages: any[];
  censorships: any[];
}) {
  const router = useRouter();

  const [chapterData, setChapterData] = useState<ChapterResponse | any>(
    initialChapterData,
  );

  const [chapterMetadata, setChapterMetadata] = useState({
    title: initialChapterData?.title || "",
    censorship_id:
      censorships.find((c) => c.name === initialChapterData?.censorship?.name)
        ?.id ||
      censorships[0]?.id ||
      "",
    language_code:
      initialChapterData?.language?.code || languages[0]?.code || "",
  });

  const [deletedPages, setDeletedPages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const handleSave = async () => {
    if (!chapterMetadata.censorship_id) {
      toast.error("Please select censorship");
      return;
    }

    if (!chapterMetadata.language_code) {
      toast.error("Please select language");
      return;
    }

    const invalidReplace = pages.find(
      (page) => page.isExisting && page.isReplaced && !page.file,
    );

    if (invalidReplace) {
      toast.error("Some replaced pages have no file selected");
      return;
    }

    setIsSaving(true);
    setUploadProgress(0);

    try {
      const currentPageIds = pages.filter((p) => p.isExisting).map((p) => p.id);
      const validDeletedPages = deletedPages.filter(
        (id) => !currentPageIds.includes(id),
      );

      if (validDeletedPages.length !== deletedPages.length) {
        console.warn(
          "Filtered out invalid deleted pages:",
          deletedPages.filter((id) => !validDeletedPages.includes(id)),
        );
      }

      const payload = {
        title: chapterMetadata.title,
        censorship_id: chapterMetadata.censorship_id,
        language_code: chapterMetadata.language_code,
        pages: pages.map((page, index) => ({
          id: page.isExisting ? page.id : null,
          temp_id: !page.isExisting || page.isReplaced ? page.id : null,
          page_number: index + 1,
          action: page.isExisting
            ? page.isReplaced
              ? "replace"
              : "keep"
            : "create",
          filename: page.filename ?? null,
        })),
        deleted_pages: validDeletedPages,
      };

      const formData = new FormData();
      formData.append("document", JSON.stringify(payload));

      pages.forEach((page) => {
        const shouldUpload =
          (!page.isExisting && page.file) ||
          (page.isExisting && page.isReplaced && page.file);

        if (shouldUpload) {
          formData.append(`files_${page.id}`, page.file!);
        }
      });

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", `${BACKEND_URL}/chapters/${chapterId}`, true);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100,
            );
            setUploadProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(json);
            } else {
              const message = Array.isArray(json.message)
                ? json.message.join(", ")
                : json.message;
              reject(new Error(message || "Failed to update chapter"));
            }
          } catch (e) {
            reject(new Error("Failed to parse response"));
          }
        };

        xhr.onerror = () => reject(new Error("Network Error"));
        xhr.send(formData);
      });

      toast.success("Chapter updated successfully");
      router.push(`/comic/${slug}`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update chapter",
      );
    } finally {
      setIsSaving(false);
    }
  };
  const handleReplacePage = (pageId: string, file: File) => {
    setPages((prev) =>
      prev.map((page) =>
        page.id === pageId
          ? {
              ...page,
              file,
              filename: file.name,
              url: URL.createObjectURL(file),
              isReplaced: true,
            }
          : page,
      ),
    );
  };

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPages((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        console.warn("Invalid drag indices detected", {
          oldIndex,
          newIndex,
          activeId: active.id,
          overId: over.id,
        });
        return items;
      }

      const reordered = arrayMove(items, oldIndex, newIndex);
      return reordered.map((item, idx) => ({
        ...item,
        page: idx + 1,
      }));
    });
  };

  const initialMappedPages = (initialChapterData?.pages || [])
    .sort((a: any, b: any) => a.page_number - b.page_number)
    .map((page: any) => ({
      id: page.id,
      page: page.page_number,
      filename: page.filename,
      url: `${BACKEND_URL}${page.filepath}`,
      isExisting: true,
    }));
  const [pages, setPages] = useState<EditablePage[]>(initialMappedPages);

  const handleUploadPages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const toastId = toast.loading("Processing files...");
    let newPages: any[] = [];
    let currentLength = pages.length;

    try {
      for (const file of files) {
        if (file.name.toLowerCase().match(/\.(pdf|zip|cbz)$/)) {
          toast.loading(`Extracting ${file.name} on server...`, {
            id: toastId,
          });
          try {
            const extractedFiles = await extractFileViaScraper(file);
            for (const extractedFile of extractedFiles) {
              newPages.push({
                id: crypto.randomUUID(),
                page: currentLength + newPages.length + 1,
                file: extractedFile,
                filename: extractedFile.name,
                url: URL.createObjectURL(extractedFile),
              });
            }
          } catch (err: any) {
            toast.error(err.message || "Failed to extract");
          }
        } else {
          newPages.push({
            id: crypto.randomUUID(),
            page: currentLength + newPages.length + 1,
            file,
            filename: file.name,
            url: URL.createObjectURL(file),
          });
        }
      }

      setPages((prev) => [...prev, ...newPages]);
      toast.success(`Processed ${newPages.length} pages`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to process files", { id: toastId });
    }
  };
  const handleClearPages = () => {
    const existingIds = pages.filter((p) => p.isExisting).map((p) => p.id);
    setDeletedPages((prev) => [...prev, ...existingIds]);
    setPages([]);
  };
  const handleDeletePage = (id: string) => {
    setPages((currentPages) => {
      const page = currentPages.find((x) => x.id === id);

      if (page?.isExisting) {
        setDeletedPages((prev) => (prev.includes(id) ? prev : [...prev, id]));
      }

      const filtered = currentPages.filter((page) => page.id !== id);
      const normalized = filtered.map((page, idx) => ({
        ...page,
        page: idx + 1,
      }));

      return normalized;
    });
  };
  const inputId = "chapter-pages-upload";

  const handleDeleteChapter = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/chapters/${chapterId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to delete chapter");
      }

      toast.success("Chapter deleted successfully");
      router.push(`/comic/${slug}`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete chapter",
      );
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950">
      <input
        type="file"
        id={inputId}
        multiple
        accept="image/*,.pdf,.zip,.cbz"
        className="hidden"
        onChange={handleUploadPages}
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
      />
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4">
          {/* ================= LEFT ================= */}
          <div className="flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Edit Chapter
              </p>
            </div>
          </div>
          {/* ================= CENTER ================= */}
          {/* CENTER */}
          <div className="flex justify-center">
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-5 py-3 backdrop-blur-sm">
              {/* Comic ID */}
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-400" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Comic ID
                </span>
                <span className="font-mono text-sm font-bold text-white">
                  {chapterData?.comic.legacy_id || "-"}
                </span>
              </div>

              {/* Divider */}
              <div className="h-5 w-px bg-zinc-800" />

              {/* Chapter Number */}
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-amber-400" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Chapter
                </span>

                <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-300">
                  #{chapterData?.chapter.chapter_number || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* ================= RIGHT ================= */}
          <div className="flex items-center justify-end gap-3">
            <Link href={`/comic/${chapterData?.comic.id || slug}`}>
              <button className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white">
                Cancel
              </button>
            </Link>

            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              <Save className="h-4 w-4" />
              {isSaving
                ? uploadProgress < 100
                  ? `Uploading... ${uploadProgress}%`
                  : "Processing..."
                : "Save"}
            </button>
          </div>
        </div>
      </header>

      {/* ================= CONTENT ================= */}
      <div className="grid gap-6 p-6 xl:grid-cols-[360px_1fr]">
        {/* ================= LEFT ================= */}
        <div className="space-y-6">
          {/* Metadata */}
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="mb-6 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-400" />

              <h2 className="text-lg font-bold text-white">Chapter Metadata</h2>
            </div>

            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Chapter Title
                </label>
                <input
                  type="text"
                  value={chapterMetadata.title}
                  onChange={(e) =>
                    setChapterMetadata((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
                />
              </div>

              {/* Censorship */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Censorship
                </label>
                <select
                  value={chapterMetadata.censorship_id}
                  onChange={(e) =>
                    setChapterMetadata((prev) => ({
                      ...prev,
                      censorship_id: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
                >
                  {censorships.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Language
                </label>
                <select
                  value={chapterMetadata.language_code}
                  onChange={(e) =>
                    setChapterMetadata((prev) => ({
                      ...prev,
                      language_code: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
                >
                  {languages.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Save Confirm Dialog */}
          <AlertDialog
            open={showConfirmDialog}
            onOpenChange={setShowConfirmDialog}
          >
            <AlertDialogContent className="bg-zinc-950 border-zinc-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">
                  Save Changes
                </AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                  Are you sure you want to save these chapter changes? This will
                  replace the uploaded pages and update metadata.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setShowConfirmDialog(false);
                    handleSave();
                  }}
                  className="bg-indigo-500 text-white hover:bg-indigo-400"
                >
                  Confirm Save
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
            <h2 className="mb-4 text-lg font-bold text-red-300">Danger Zone</h2>

            <AlertDialog>
              <AlertDialogTrigger className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200">
                <Trash2 className="h-4 w-4" />
                Delete Chapter
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-zinc-950 border-zinc-800">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-400">
                    Delete Chapter
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400">
                    Are you sure you want to delete chapter "
                    {chapterMetadata.title}"? This will permanently delete the
                    chapter metadata, all pages, and images.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteChapter}
                    className="bg-red-500/20 text-red-300 hover:bg-red-500/30"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-white">Chapter Pages</h2>

              <p className="mt-1 text-xs text-zinc-500">
                {chapterData?.chapter.total_pages || pages.length} pages
                uploaded
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Add */}
              <button
                onClick={() => document.getElementById(inputId)?.click()}
                className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-white"
              >
                <Plus className="h-4 w-4" />
                Add Pages
              </button>

              {/* Clear */}
              <button
                onClick={handleClearPages}
                className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-red-500 hover:bg-red-500/10 hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>

          {/* Empty State */}
          {pages.length === 0 ? (
            <div className="flex h-120 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900">
                <ImageIcon className="h-8 w-8 text-zinc-600" />
              </div>

              <h3 className="text-lg font-bold text-white">
                No Pages Uploaded
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                Start adding chapter pages to preview and manage them here.
              </p>

              <button
                onClick={() => document.getElementById(inputId)?.click()}
                className="mt-6 flex items-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                <Plus className="h-4 w-4" />
                Add Pages
              </button>
            </div>
          ) : (
            /* Pages Grid */
            <div className="p-5">
              <DndContext
                id="dnd-chapter-edit"
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                autoScroll={false}
              >
                <SortableContext
                  items={pages.map((p) => p.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {pages.map((page) => (
                      <SortablePageCard
                        key={page.id}
                        page={page}
                        onDelete={handleDeletePage}
                        onReplace={handleReplacePage}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ================= SORTABLE PAGE CARD =================
const SortablePageCard = React.memo(function SortablePageCard({
  page,
  onDelete,
  onReplace,
}: SortablePageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    willChange: "transform",
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative overflow-hidden rounded-2xl border bg-zinc-950
        will-change-transform select-none
        ${
          isDragging
            ? "z-50 border-indigo-500 ring-2 ring-indigo-500/30"
            : "border-zinc-800 hover:border-indigo-500/40"
        }
      `}
    >
      {/* Image */}
      <div className="aspect-3/4 overflow-hidden bg-zinc-800">
        {page.url ? (
          <img
            src={page.url}
            alt={`Page ${page.page}`}
            draggable={false}
            loading="lazy"
            className={`
              h-full w-full object-cover
              pointer-events-none select-none
              ${isDragging ? "" : "transition-transform duration-200 group-hover:scale-[1.02]"}
            `}
          />
        ) : (
          <div className="h-full w-full bg-zinc-800" />
        )}
      </div>

      {/* Badge */}
      <div className="absolute left-2 top-2">
        <span className="rounded-lg bg-zinc-950/90 px-2 py-1 text-[10px] font-bold text-indigo-400 backdrop-blur">
          #{page.page}
        </span>
      </div>

      {page.isReplaced && (
        <div className="absolute right-2 top-2">
          <span
            className="
              rounded-lg
              bg-amber-500/90
              px-2 py-1
              text-[10px]
              font-bold
              text-white
            "
          >
            REPLACED
          </span>
        </div>
      )}

      {/* Overlay */}
      <div
        className={`absolute inset-0 flex items-end justify-between gap-2 p-3 transition-opacity duration-150
          ${
            isDragging
              ? "bg-black/20 opacity-100"
              : "bg-black/40 opacity-0 group-hover:opacity-100"
          }
        `}
      >
        {/* Drag */}
        <button
          {...attributes}
          {...listeners}
          className="
            cursor-grab active:cursor-grabbing
            rounded-xl bg-zinc-950/90 p-2
            text-zinc-300 backdrop-blur
            transition hover:text-white
            touch-none
          "
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <label
          className="
            cursor-pointer
            rounded-xl
            bg-blue-500/90
            p-2
            text-white
            backdrop-blur
            transition
            hover:bg-blue-600
          "
        >
          <RefreshCcw className="h-4 w-4" />

          <input
            type="file"
            accept="image/*,.pdf,.zip,.cbz"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (!file) return;

              onReplace(page.id, file);

              e.target.value = "";
            }}
          />
        </label>

        {/* Delete */}
        <button
          onClick={() => onDelete(page.id)}
          className="
            rounded-xl bg-red-500/90 p-2
            text-white backdrop-blur
            transition hover:bg-red-600
          "
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});
