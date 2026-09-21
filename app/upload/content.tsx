"use client";

import { useState, useCallback, useEffect } from "react";
import { v7 as uuidv7 } from "uuid";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Plus,
  FilePlus,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  KeyboardSensor,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { getCroppedImg } from "@/lib/cropImage";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Censorship,
  Chapter,
  Language,
  Status,
  TempPage,
  fields,
} from "@/types/uploadPage";
import { ExtractModal } from "./components/ExtractModal";
import { FixModal } from "./components/FixModal";
import { UploadPagesModal } from "./components/UploadPagesModal";
import { ImageCropModal } from "./components/ImageCropModal";
import { publishComicAction, extractMetadataAction } from "./actions/actions";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChapterListSection } from "./components/ChapterListSection";

type UploadPageClientProps = {
  statuses: Status[];
  censorships: Censorship[];
  languages: Language[];
};

export default function UploadPageClient({
  statuses,
  censorships,
  languages,
}: UploadPageClientProps) {
  const [activeTemplate, setActiveTemplate] = useState<string>("doujinshi");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [chapters, setChapters] = useState<Chapter[]>(() => [
    {
      id: uuidv7(),
      main: 1,
      sub: 0,
      title: "",
      censorship_id: censorships[0]?.id || "",
      language: languages[0]?.code || "en",
      pages: [],
    },
  ]);

  const [isPublishing, setIsPublishing] = useState(false);
  const handlePublish = async () => {
    // =========================
    // VALIDASI DASAR (Sebelum Loading)
    // =========================
    if (!metadata.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!sortedChapters.length) {
      toast.error("At least 1 chapter is required");
      return;
    }

    // Tampilkan notifikasi loading interaktif
    const toastId = toast.loading("Publishing comic, please wait...");

    try {
      setIsPublishing(true);

      // =========================
      // INIT FORMDATA
      // =========================
      const formData = new FormData();

      // =========================
      // CLEAN METADATA
      // =========================
      const cleanMetadata = {
        ...metadata,
      } as Partial<typeof metadata>;

      // TEMPLATE RULES
      if (activeTemplate === "manhwa") {
        delete cleanMetadata.groups;
      }
      if (activeTemplate === "doujinshi" || activeTemplate === "manga") {
        delete cleanMetadata.authors;
      }

      // =========================
      // CLEAN EMPTY STRING
      // =========================
      Object.keys(cleanMetadata).forEach((key) => {
        const value = cleanMetadata[key as keyof typeof cleanMetadata];
        if (value === undefined || value === null || value === "") {
          delete cleanMetadata[key as keyof typeof cleanMetadata];
        }
      });

      // =========================
      // BUILD DOCUMENT
      // =========================
      const textData = {
        template: activeTemplate,
        status: metadata.status_id || "ongoing",
        metadata: cleanMetadata,
        chapters: sortedChapters.map((ch) => ({
          id: ch.id,
          main: Number(ch.main),
          sub: Number(ch.sub || 0),
          title: ch.title?.trim() || null,
          censorship_id: ch.censorship_id,
          language: ch.language,
          pagesCount: ch.pages.length,
        })),
      };

      // =========================
      // DOCUMENT JSON
      // =========================
      formData.append("document", JSON.stringify(textData));

      // =========================
      // COVER
      // =========================
      if (typeof coverImage === "string") {
        const response = await fetch(coverImage);
        const coverBlob = await response.blob();
        formData.append("cover", coverBlob, "cover.jpg");
      } else {
        formData.append("cover", coverImage!);
      }

      // =========================
      // PAGES
      // =========================
      for (const chapter of sortedChapters) {
        for (let i = 0; i < chapter.pages.length; i++) {
          const pageSrc = chapter.pages[i];
          // blob url
          if (typeof pageSrc === "string" && pageSrc.startsWith("blob:")) {
            const response = await fetch(pageSrc);
            const pageBlob = await response.blob();
            formData.append(
              `pages_${chapter.id}`,
              pageBlob,
              `page_${i + 1}.jpg`,
            );
            continue;
          }
          // file object
          formData.append(`pages_${chapter.id}`, pageSrc);
        }
      }

      // =========================
      // DEBUG
      // =========================
      console.log("=== [DEBUG] FORM DATA UNTUK BACKEND ===");
      console.log("1. Teks Data (JSON):", textData);
      console.log("2. Properti FormData siap kirim:");
      for (const pair of formData.entries()) {
        if (pair[1] instanceof Blob) {
          console.log(` - ${pair[0]}: [File] ${pair[1].size} bytes`);
        } else {
          console.log(` - ${pair[0]}:`, pair[1]);
        }
      }
      console.log("=======================================");

      // =========================
      // REQUEST
      // =========================
      const result = await publishComicAction(formData);
      if (!result.success) {
        throw new Error(result.message || "Upload failed");
      }

      console.log(result);

      // Ubah status loading menjadi sukses
      toast.success("Comic published successfully!", { id: toastId });

      setTimeout(() => {
        window.location.href = "/upload";
      }, 1000);

      return result;
    } catch (error: any) {
      // Pesan error dialihkan ke toast, log error console dihapus
      const errorMessage = error?.message || "Failed to publish comic";
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsPublishing(false);
    }
  };

  // FIX PARAGRAPH MODAL STATE
  const [fixModal, setFixModal] = useState<{
    open: boolean;
    field: string;
    value: string;
    preview: string;
  }>({
    open: false,
    field: "",
    value: "",
    preview: "",
  });
  const [metadata, setMetadata] = useState({
    title: "",
    alternative_title: "",
    parodies: "",
    characters: "",
    artists: "",
    authors: "",
    groups: "",
    tags: "",
    status_id: statuses[0]?.id,
  });
  const fixParagraph = useCallback((text: any) => {
    if (!text) return "";
    let result = Array.isArray(text) ? text.join(", ") : String(text);
    result = result.replace(/[|♀♂•−]/g, ",");
    result = result.replace(/\s+\d+(\.\d+)?[km]?/gi, ",");
    const parts = result
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const unique = [...new Set(parts)];
    return unique.join(", ");
  }, []);
  const openFixModal = (field: string, value: string) => {
    setFixModal({
      open: true,
      field,
      value,
      preview: fixParagraph(value),
    });
  };
  const saveFixMetadata = () => {
    setMetadata((prev) => ({
      ...prev,
      [fixModal.field.toLowerCase()]: fixModal.preview,
    }));

    setFixModal({
      open: false,
      field: "",
      value: "",
      preview: "",
    });
  };

  // COVER IMAGE STATE
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [savedCrop, setSavedCrop] = useState({ x: 0, y: 0 });
  const [savedRotation, setSavedRotation] = useState(0);
  const [savedZoom, setSavedZoom] = useState(1);
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const resultStr = reader.result as string;
        setImageSrc(resultStr);
        setOriginalSrc(resultStr);
        setCrop({ x: 0, y: 0 });
        setRotation(0);
        setZoom(1);
        setSavedCrop({ x: 0, y: 0 });
        setSavedRotation(0);
        setSavedZoom(1);
      });
      reader.readAsDataURL(file);
    }
  };
  const handleEditExisting = (e: React.MouseEvent) => {
    e.preventDefault();
    if (originalSrc) {
      setCrop(savedCrop);
      setRotation(savedRotation);
      setZoom(savedZoom);
      setImageSrc(originalSrc);
    }
  };
  const saveCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
      );
      setCoverImage(cropped);
      setSavedCrop(crop);
      setSavedRotation(rotation);
      setSavedZoom(zoom);
      setImageSrc(null);
    } catch (e) {
      console.error(e);
    }
  };
  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // CHAPTER STATE MANAGEMENT
  const getSortedList = (list: Chapter[]) => {
    return [...list].sort((a, b) => {
      if (a.main !== b.main) return a.main - b.main;
      return a.sub - b.sub;
    });
  };
  const addChapter = () => {
    setChapters((prev) => {
      const sortedPrev = getSortedList(prev);
      const lastMain =
        sortedPrev.length > 0 ? sortedPrev[sortedPrev.length - 1].main : 0;
      const defaultCensorshipId = censorships[0]?.id || "";
      return [
        ...prev,
        {
          id: uuidv7(),
          main: lastMain + 1,
          sub: 0,
          title: "",
          censorship_id: defaultCensorshipId,
          language: "en",
          pages: [],
        },
      ];
    });
  };
  const removeChapter = (id: string) => {
    setChapters((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      const sorted = getSortedList(filtered);
      return sorted.map((chapter, index) => ({
        ...chapter,
        main: index + 1,
      }));
    });
  };
  const updateChapter = (
    id: string,
    field: keyof Chapter,
    value: string | number,
  ) => {
    setChapters((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              [field]: value,
            }
          : c,
      ),
    );
  };
  const sortedChapters = [...chapters].sort((a, b) => {
    if (a.main !== b.main) {
      return a.main - b.main;
    }
    return a.sub - b.sub;
  });
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  });
  const sensors = useSensors(pointerSensor);
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setChapters((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      return reordered.map((chapter, index) => ({
        ...chapter,
        main: index + 1,
      }));
    });
  };

  // PAGES STATE MANAGEMENT
  const [activeUploadChapterId, setActiveUploadChapterId] = useState<
    string | null
  >(null);
  const [tempPages, setTempPages] = useState<TempPage[]>([]);
  const handlePagesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    chapterId: string,
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      const mappedFiles = filesArray.map((file) => ({
        id: uuidv7(),
        name: file.name,
        url: URL.createObjectURL(file),
      }));
      setTempPages((prev) => [...prev, ...mappedFiles]);
      setActiveUploadChapterId(chapterId);
    }
  };
  const handleOpenPreview = (chapterId: string, savedPages: string[]) => {
    const mappedPages = savedPages.map((url, idx) => ({
      id: uuidv7(),
      name: `Page_${idx + 1}.jpg`,
      url: url,
    }));
    setTempPages(mappedPages);
    setActiveUploadChapterId(chapterId);
  };
  const saveUploadedPages = () => {
    if (!activeUploadChapterId) return;
    setChapters((prev) =>
      prev.map((c) =>
        c.id === activeUploadChapterId
          ? { ...c, pages: tempPages.map((p) => p.url) }
          : c,
      ),
    );
    setActiveUploadChapterId(null);
    setTempPages([]);
  };
  const cancelUploadedPages = () => {
    tempPages.forEach((p) => URL.revokeObjectURL(p.url));
    setActiveUploadChapterId(null);
    setTempPages([]);
  };
  const handleAppendPages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);

      const mappedNewFiles = filesArray.map((file) => ({
        id: uuidv7(),
        name: file.name,
        url: URL.createObjectURL(file),
      }));
      setTempPages((prev) => [...prev, ...mappedNewFiles]);
    }
  };
  const removeSingleTempPage = (indexToRemove: number) => {
    setTempPages((prev) => {
      const target = prev[indexToRemove];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };
  const sensorsPages = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const handleDragEndPages = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setTempPages((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);

      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  // EXTRACT METADATA FROM URL
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extractUrl, setExtractUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const handleExtract = async () => {
    if (!extractUrl.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    // Tampilkan notifikasi loading interaktif
    const toastId = toast.loading("Extracting metadata...");

    try {
      setExtracting(true);

      const result = await extractMetadataAction(extractUrl);
      if (!result.success) {
        throw new Error(result.message || "Failed to extract metadata");
      }

      const data = result.data;
      setMetadata((prev) => ({
        ...prev,
        title: data!.title || "",
        alternative_title: data!.alternative_title || "",
        parodies: Array.isArray(data!.parodies)
          ? data!.parodies.join(", ")
          : "",
        characters: Array.isArray(data!.characters)
          ? data!.characters.join(", ")
          : "",
        artists: Array.isArray(data!.artists) ? data!.artists.join(", ") : "",
        groups: Array.isArray(data!.groups) ? data!.groups.join(", ") : "",
        tags: Array.isArray(data!.tags) ? data!.tags.join(", ") : "",
      }));

      setShowExtractModal(false);
      setExtractUrl("");

      // Ubah status loading menjadi sukses
      toast.success("Metadata extracted successfully!", { id: toastId });
    } catch (error) {
      // Pesan error dialihkan ke toast, console.error dihapus sesuai permintaan
      const errorMessage =
        error instanceof Error ? error.message : "Failed to extract metadata";
      toast.error(errorMessage, { id: toastId });
    } finally {
      setExtracting(false);
    }
  };

  const handleCloseModal = () => {
    setShowExtractModal(false);
    setExtractUrl("");
  };

  if (!isMounted) {
    return null; // atau sertakan markup kerangka (skeleton) tanpa DndContext
  }

  return (
    <div>
      <Header
        logo={false}
        showSearch={false}
        showRandom={false}
        leftContent={
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-1.5 rounded-xl border-border/80 bg-card hover:bg-accent hover:text-foreground shadow-xs"
          >
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </Button>
        }
        centerContent={
          <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-card p-1 shadow-xs">
            {[
              { key: "doujinshi", label: "Doujinshi" },
              { key: "manga", label: "Manga" },
              { key: "manhwa", label: "Manhwa" },
            ].map((item) => {
              const isActive = activeTemplate === item.key;
              return (
                <Button
                  key={item.key}
                  type="button"
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTemplate(item.key)}
                  className={`h-7 rounded-lg px-3 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Button>
              );
            })}
          </div>
        }
        rightContent={
          <>
            <Button
              type="button"
              onClick={() => setShowExtractModal(true)}
              className="h-8 rounded-xl bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20 shadow-none border-none"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Extract
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePublish}
              disabled={isPublishing}
              className="gap-2 rounded-xl bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50"
            >
              {isPublishing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              <span>{isPublishing ? "Publishing..." : "Publish Comic"}</span>
            </Button>
          </>
        }
      />

      <main className="mx-auto grid max-w-7xl grid-cols-4 px-6 pb-10 mt-6 gap-6.5">
        {/* cover and status */}
        <div className="col-span-1">
          <Card className="rounded-3xl p-6 shadow-sm transition-all border-border/80 h-126">
            <input
              type="file"
              id="cover-upload"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
              onClick={(e) => {
                (e.target as HTMLInputElement).value = "";
              }}
            />

            {/* Preview / Dropzone Box */}
            <div
              onClick={(e) => {
                if (coverImage) {
                  handleEditExisting(e);
                } else {
                  document.getElementById("cover-upload")?.click();
                }
              }}
              className="group relative block aspect-[2/3] w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-border/80 bg-muted/30 transition-all hover:border-primary/50 hover:bg-muted/50"
            >
              {coverImage ? (
                <img
                  src={coverImage}
                  alt="Comic Cover"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2.5 p-4 text-muted-foreground">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">
                      Upload Cover Image
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      JPG, PNG atau WEBP • Click to browse
                    </p>
                  </div>
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 backdrop-blur-[2px] transition duration-200 group-hover:opacity-100">
                <span className="flex items-center gap-1.5 rounded-xl border border-border bg-background/90 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {coverImage ? "Edit / Re-crop Image" : "Choose File"}
                </span>
              </div>
            </div>

            {/* Footer Actions */}
            {coverImage && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("cover-upload")?.click()
                  }
                  className="rounded-xl text-xs h-9"
                >
                  Replace
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setCoverImage(null)}
                  className="rounded-xl text-xs h-9 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 shadow-none"
                >
                  Remove
                </Button>
              </div>
            )}

            {/* Status Section */}
            <div className="mt-5 space-y-2 border-t border-border/60 pt-4">
              <label className="block text-xs font-semibold text-foreground/80">
                Publication Status <span className="text-destructive">*</span>
              </label>

              <Select
                value={
                  metadata.status_id
                    ? String(metadata.status_id).trim().toLowerCase()
                    : ""
                }
                onValueChange={(value) =>
                  setMetadata((prev) => ({
                    ...prev,
                    status_id: value || "",
                  }))
                }
              >
                <SelectTrigger className="w-full rounded-xl text-xs h-10 focus:ring-2 focus:ring-primary/20">
                  <SelectValue>
                    {statuses.find(
                      (s) =>
                        String(s.id).trim().toLowerCase() ===
                        String(metadata.status_id).trim().toLowerCase(),
                    )?.name || "Pilih status"}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent
                  className="rounded-xl"
                  alignItemWithTrigger={false}
                >
                  {statuses.map((status) => (
                    <SelectItem
                      key={status.id}
                      value={String(status.id).trim().toLowerCase()}
                      className="text-xs rounded-lg"
                    >
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        <div className="col-span-3">
          <Card className="h-fit rounded-3xl p-6 shadow-sm transition-all border-border/80">
            <div className="space-y-4">
              {fields
                .filter((field) => {
                  if (activeTemplate === "manhwa" && field.label === "Groups")
                    return false;
                  if (
                    (activeTemplate === "doujinshi" ||
                      activeTemplate === "manga") &&
                    field.label === "Authors"
                  ) {
                    return false;
                  }
                  return true;
                })
                .map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-foreground/80">
                        {field.label}
                        {field.required && (
                          <span className="text-destructive">*</span>
                        )}
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={String(
                          metadata[field.key as keyof typeof metadata] || "",
                        )}
                        onChange={(e) =>
                          setMetadata((prev) => ({
                            ...prev,
                            [field.key as keyof typeof metadata]:
                              e.target.value,
                          }))
                        }
                        placeholder={field.placeholder}
                        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:outline-none"
                      />

                      {field.key !== "title" && (
                        <Button
                          type="button"
                          onClick={() => {
                            const rawValue =
                              metadata[field.key as keyof typeof metadata];
                            const safeValue =
                              rawValue !== null && rawValue !== undefined
                                ? String(rawValue)
                                : "";

                            openFixModal(field.label, safeValue);
                          }}
                          className="p-5 gap-1 rounded-lg bg-primary/10 text-xs font-medium text-primary hover:bg-primary/20 shadow-none border-none shrink-0"
                        >
                          <Sparkles className="size-3.5 shrink-0" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        <div className="col-span-full">
          <section className="h-fit">
            <Card className="rounded-3xl border border-border/80 bg-card shadow-sm">
              {/* Header */}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FilePlus className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">
                      Chapters
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Manage comic chapters and pages
                    </CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={addChapter}
                  size="sm"
                  className="gap-2 rounded-xl"
                >
                  <Plus className="h-4 w-4" /> Add Chapter
                </Button>
              </CardHeader>
              {/* Chapter Items */}
              <ChapterListSection
                sensors={sensors}
                sortedChapters={sortedChapters}
                censorships={censorships}
                languages={languages}
                handleDragEnd={handleDragEnd}
                updateChapter={updateChapter}
                removeChapter={removeChapter}
                handlePagesChange={handlePagesChange}
                handleOpenPreview={handleOpenPreview}
              />
            </Card>
          </section>
        </div>
      </main>

      {/* Extract Modal */}
      <ExtractModal
        isOpen={showExtractModal}
        onClose={handleCloseModal}
        extractUrl={extractUrl}
        setExtractUrl={setExtractUrl}
        onExtract={handleExtract}
        isExtracting={extracting}
      />

      {/* FIX METADATA MODAL */}
      <FixModal
        modalData={fixModal}
        setModalData={setFixModal}
        onSave={saveFixMetadata}
        onFixParagraph={fixParagraph}
      />

      {/* LIST PAGES UPLOAD MODAL */}
      <UploadPagesModal
        activeUploadChapterId={activeUploadChapterId}
        tempPages={tempPages}
        setTempPages={setTempPages}
        sensorsPages={sensorsPages}
        handleDragEndPages={handleDragEndPages}
        cancelUploadedPages={cancelUploadedPages}
        saveUploadedPages={saveUploadedPages}
        removeSingleTempPage={removeSingleTempPage}
        handleAppendPages={handleAppendPages}
      />

      {/* CROP & ROTATE MODAL */}
      <ImageCropModal
        imageSrc={imageSrc}
        setImageSrc={setImageSrc}
        crop={crop}
        setCrop={setCrop}
        rotation={rotation}
        setRotation={setRotation}
        zoom={zoom}
        setZoom={setZoom}
        onCropComplete={onCropComplete}
        saveCroppedImage={saveCroppedImage}
      />
    </div>
  );
}
