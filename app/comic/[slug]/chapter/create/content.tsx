"use client";
import { extractFileViaScraper } from "@/lib/server-extractor";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, memo, useEffect } from "react";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  PointerSensor,
  closestCenter,
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
  Plus,
  Trash2,
  GripVertical,
  ImageIcon,
  BookOpen,
} from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { BACKEND_URL } from "@/lib/constant";
import {
  ChapterPage,
  Censorship,
  ChapterListResponse,
  Language,
} from "@/types/chapterPage";

export default function CreateChapterContent({
  slug,
  initialNextChapterNumber,
  initialLanguages,
  initialCensorships,
}: {
  slug: string;
  initialNextChapterNumber: string;
  initialLanguages: Language[];
  initialCensorships: Censorship[];
}) {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pages, setPages] = useState<ChapterPage[]>([]);
  const [chapterTitle, setChapterTitle] = useState("");
  const [languages, setLanguages] = useState<Language[]>(initialLanguages);
  const [censorships, setCensorships] =
    useState<Censorship[]>(initialCensorships);
  const [language, setLanguage] = useState(
    initialLanguages.length > 0 ? initialLanguages[0].code : "",
  );
  const [contentType, setContentType] = useState(
    initialCensorships.length > 0 ? initialCensorships[0].id : "",
  );
  const [nextChapterNumber, setNextChapterNumber] = useState(
    initialNextChapterNumber,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [chaptersRes, languagesRes, censorshipsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/comics/${slug}/chapters`, {
            cache: "no-store",
          }),
          fetch(`${BACKEND_URL}/system/languages`),
          fetch(`${BACKEND_URL}/system/censorships`),
        ]);

        if (!chaptersRes.ok || !languagesRes.ok || !censorshipsRes.ok) {
          throw new Error("Failed to fetch initial data");
        }

        const chaptersData: ChapterListResponse = await chaptersRes.json();
        const languagesData: Language[] = await languagesRes.json();
        const censorshipsData: Censorship[] = await censorshipsRes.json();
        setLanguages(languagesData);
        setCensorships(censorshipsData);

        if (languagesData.length > 0) {
          setLanguage(languagesData[0].code);
        }

        if (censorshipsData.length > 0) {
          setContentType(censorshipsData[0].id);
        }

        const nextNumber = String(chaptersData.total_chapters + 1).padStart(
          3,
          "0",
        );

        setNextChapterNumber(nextNumber);
      } catch (error) {
        console.error(error);
      }
    };

    if (slug) {
      fetchInitialData();
    }
  }, [slug, BACKEND_URL]);

  /* ================= DND ================= */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const normalizePages = (items: ChapterPage[]) => {
    return items.map((page, idx) => ({
      ...page,
      page: idx + 1,
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setPages((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);

      return normalizePages(arrayMove(items, oldIndex, newIndex));
    });
  };

  /* ================= ADD PAGES ================= */
  const handleAddPages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const toastId = toast.loading("Processing files...");
    let mapped: any[] = [];
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
              mapped.push({
                id: crypto.randomUUID(),
                page: currentLength + mapped.length + 1,
                file: extractedFile,
                previewUrl: URL.createObjectURL(extractedFile),
              });
            }
          } catch (err: any) {
            toast.error(err.message || "Failed to extract");
          }
        } else {
          mapped.push({
            id: crypto.randomUUID(),
            page: currentLength + mapped.length + 1,
            file,
            previewUrl: URL.createObjectURL(file),
          });
        }
      }

      setPages((prev) => [...prev, ...mapped]);
      toast.success(`Processed ${mapped.length} pages`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to process files", { id: toastId });
    }

    e.target.value = "";
  };

  /* ================= CLEAR ================= */
  const handleClearPages = () => {
    setPages([]);
  };

  /* ================= DELETE ================= */
  const handleDeletePage = (id: string) => {
    const filtered = pages.filter((page) => page.id !== id);

    setPages(normalizePages(filtered));
  };

  const handleCreateChapter = async () => {
    setIsSaving(true);
    setUploadProgress(0);
    try {
      const payload = {
        comic_id: slug,
        title: chapterTitle.trim() || `Chapter ${nextChapterNumber}`,
        chapter_number: nextChapterNumber,
        language_code: language,
        censorship_id: contentType,
        pages: pages.map((page, index) => ({
          temp_id: page.id,
          page_number: index + 1,
          filename: page.file.name,
        })),
      };

      const formData = new FormData();
      formData.append("metadata", JSON.stringify(payload));
      pages.forEach((page) => {
        formData.append(page.id, page.file, page.file.name);
      });

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${BACKEND_URL}/comics/${slug}/chapters`, true);
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
              reject(new Error(message || "Failed to create chapter"));
            }
          } catch (e) {
            reject(new Error("Failed to parse response"));
          }
        };
        xhr.onerror = () => reject(new Error("Network Error"));
        xhr.send(formData);
      });

      toast.success("Chapter created successfully");
      router.push(`/comic/${slug}`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create chapter",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4">
          {/* LEFT */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Create Chapter
            </p>

            <h1 className="text-2xl font-black text-white">Add New Chapter</h1>
          </div>

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
                  #{slug}
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
                  #{nextChapterNumber}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center justify-end gap-3">
            <Link href={`/comic/${slug}`}>
              <button className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white">
                Cancel
              </button>
            </Link>

            {/* Save Confirm Dialog */}
            <AlertDialog
              open={showConfirmDialog}
              onOpenChange={setShowConfirmDialog}
            >
              <AlertDialogContent className="bg-zinc-950 border-zinc-800">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">
                    Publish Chapter
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400">
                    Are you sure you want to create this chapter?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setShowConfirmDialog(false);
                      handleCreateChapter();
                    }}
                    className="bg-indigo-500 text-white hover:bg-indigo-400"
                  >
                    Confirm Publish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving
                ? uploadProgress < 100
                  ? `Uploading... ${uploadProgress}%`
                  : "Processing..."
                : "Create Chapter"}
            </button>
          </div>
        </div>
      </header>

      {/* ================= CONTENT ================= */}
      <div className="grid gap-6 p-6 xl:grid-cols-[360px_1fr]">
        {/* ================= LEFT ================= */}
        <div className="space-y-6">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="mb-6 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-400" />

              <h2 className="text-lg font-bold text-white">Chapter Metadata</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Chapter Title
                </label>

                <input
                  type="text"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder={`Chapter ${nextChapterNumber}`}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Censorship
                </label>

                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-indigo-500"
                >
                  {censorships.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Language
                </label>

                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-indigo-500"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-white">Chapter Pages</h2>

              <p className="mt-1 text-xs text-zinc-500">
                {pages.length} pages uploaded
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.zip,.cbz"
                multiple
                className="hidden"
                onChange={handleAddPages}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-white"
              >
                <Plus className="h-4 w-4" />
                Add Pages
              </button>

              <button
                onClick={handleClearPages}
                className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-red-500 hover:bg-red-500/10 hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>

          {/* Empty */}
          {pages.length === 0 ? (
            <div className="flex h-120 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900">
                <ImageIcon className="h-8 w-8 text-zinc-600" />
              </div>

              <h3 className="text-lg font-bold text-white">
                No Pages Uploaded
              </h3>
            </div>
          ) : (
            <div className="p-5">
              <DndContext
                id="dnd-chapter-create"
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
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

/* ================= CARD ================= */
const SortablePageCard = memo(function SortablePageCard({
  page,
  onDelete,
}: {
  page: ChapterPage;
  onDelete: (id: string) => void;
}) {
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
    transition: isDragging ? undefined : transition,
    willChange: "transform",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden rounded-2xl border bg-zinc-950 ${
        isDragging
          ? "z-50 border-indigo-500 shadow-2xl shadow-indigo-500/20"
          : "border-zinc-800"
      }`}
    >
      {/* Image */}
      <div className="aspect-3/4 overflow-hidden bg-zinc-800">
        {page.previewUrl ? (
          <img
            src={page.previewUrl}
            alt={`Page ${page.page}`}
            loading="lazy"
            draggable={false}
            className="h-full w-full select-none object-cover pointer-events-none"
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

      {/* Hover */}
      <div className="absolute inset-0 flex items-end justify-between bg-black/40 p-3 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Drag */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded-xl bg-zinc-950/90 p-2 text-zinc-300 backdrop-blur transition hover:text-white active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(page.id)}
          className="rounded-xl bg-red-500/90 p-2 text-white backdrop-blur transition hover:bg-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});
