"use client";

import { useState, useEffect, useCallback } from "react";
import { v7 as uuidv7 } from "uuid";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  BookOpen,
  Plus,
  FilePlus,
  Trash2,
  RotateCw,
  Sparkles,
  Loader2,
  RefreshCw,
  GripVertical,
} from "lucide-react";
import Cropper from "react-easy-crop";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getCroppedImg } from "@/lib/cropImage";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Censorship,
  Chapter,
  Language,
  Status,
  TempPage,
} from "@/types/uploadPage";

export default function UploadPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [censorships, setCensorships] = useState<Censorship[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<string>("doujinshi");

  useEffect(() => {
    const fetchCommonData = async () => {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
        const [statusesRes, censorshipsRes, languagesRes] = await Promise.all([
          fetch(`${baseUrl}/system/statuses`),
          fetch(`${baseUrl}/system/censorships`),
          fetch(`${baseUrl}/system/languages`),
        ]);
        const statusesData = await statusesRes.json();
        const censorshipsData = await censorshipsRes.json();
        const languagesData = await languagesRes.json();
        setStatuses(statusesData);
        setCensorships(censorshipsData);
        setLanguages(languagesData);

        const defaultCensorshipId = censorshipsData[0]?.id || "";
        setChapters([
          {
            id: uuidv7(),
            main: 1,
            sub: 0,
            title: "",
            censorship_id: defaultCensorshipId,
            language: "en",
            pages: [],
          },
        ]);
      } catch (error) {
        console.error("Failed to fetch common data:", error);
      }
    };
    fetchCommonData();
  }, []);

  const [isPublishing, setIsPublishing] = useState(false);
  const handlePublish = async () => {
    try {
      setIsPublishing(true);

      // =========================
      // VALIDASI DASAR
      // =========================
      if (!metadata.title?.trim()) {
        alert("Title is required");
        return;
      }
      if (!sortedChapters.length) {
        alert("At least 1 chapter is required");
        return;
      }

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
        status:
          (document.querySelector("select") as HTMLSelectElement)?.value ||
          "ongoing",
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/comics/publish`,
        {
          method: "POST",
          body: formData,
        },
      );

      // =========================
      // HANDLE ERROR HTTP
      // =========================
      if (!response.ok) {
        let errorMessage = "Upload failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      // =========================
      // RESULT
      // =========================
      const result = await response.json();
      console.log(result);
      alert("Comic published successfully");
      setTimeout(() => {
        window.location.href = "/upload";
      }, 1000);
      return result;
    } catch (error: any) {
      console.error("Upload failed:", error);
      alert(error?.message || "Failed to publish comic");
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
  const [chapters, setChapters] = useState<Chapter[]>([]);
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
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
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
      alert("Please enter URL");
      return;
    }

    try {
      setExtracting(true);

      const baseUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
      const response = await fetch(`${baseUrl}/scraper/metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: extractUrl,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to extract metadata");
      }

      const data = result.data;
      setMetadata((prev) => ({
        ...prev,
        title: data.title || "",
        alternative_title: data.alternative_title || "",
        parodies: Array.isArray(data.parodies) ? data.parodies.join(", ") : "",
        characters: Array.isArray(data.characters)
          ? data.characters.join(", ")
          : "",
        artists: Array.isArray(data.artists) ? data.artists.join(", ") : "",
        groups: Array.isArray(data.groups) ? data.groups.join(", ") : "",
        tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
      }));

      setShowExtractModal(false);
      setExtractUrl("");
      alert("Metadata extracted successfully");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to extract metadata",
      );
    } finally {
      setExtracting(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="space-y-4 animate-pulse bg-zinc-900/20 rounded-3xl h-96 w-full" />
    );
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
        }
      />

      {/* Content */}
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 pb-10 lg:grid-cols-[1fr_2fr_2fr] mt-6">
        {/* ================= LEFT: COVER ================= */}
        <section className="h-fit rounded-3xl border border-border/80 bg-card p-6 shadow-sm transition-all">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Cover</h2>
                <p className="text-[11px] text-muted-foreground">
                  Gambar sampul utama
                </p>
              </div>
            </div>
          </div>

          {/* Input File Hidden */}
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
            className="group relative block aspect-2/3 w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-border/80 bg-muted/30 transition-all hover:border-primary/50 hover:bg-muted/50"
          >
            {coverImage ? (
              <img
                src={coverImage}
                alt="Comic Cover"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2.5 p-4 text-muted-foreground">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground shadow-xs transition duration-300 group-hover:scale-110 group-hover:border-primary/40 group-hover:text-primary">
                  <Upload className="h-5 w-5" />
                </div>
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
              <button
                type="button"
                onClick={() => document.getElementById("cover-upload")?.click()}
                className="rounded-xl border border-input bg-background py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                Replace
              </button>

              <button
                type="button"
                onClick={() => setCoverImage(null)}
                className="rounded-xl border border-destructive/20 bg-destructive/10 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
              >
                Remove
              </button>
            </div>
          )}

          {/* Status Section */}
          <div className="mt-5 space-y-1.5 border-t border-border/60 pt-4">
            <label className="block text-xs font-semibold text-foreground/80">
              Publication Status <span className="text-destructive">*</span>
            </label>
            <select
              onChange={(e) =>
                setMetadata((prev) => ({
                  ...prev,
                  status_id: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs font-medium text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* ================= MIDDLE: METADATA ================= */}
        <section className="h-fit rounded-3xl border border-border/80 bg-card p-6 shadow-sm transition-all">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Metadata
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Kelola atribut & relasi karya
                </p>
              </div>
            </div>

            {/* Action Button Extract */}
            <button
              type="button"
              onClick={() => setShowExtractModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Extract
            </button>
          </div>

          {/* Fields List */}
          <div className="space-y-4">
            {[
              {
                key: "title",
                label: "Title",
                placeholder: "Comic Title",
                required: true,
              },
              {
                key: "parodies",
                label: "Parodies",
                placeholder: "Solo Leveling, Naruto",
              },
              {
                key: "characters",
                label: "Characters",
                placeholder: "Sung Jin-Woo, Naruto Uzumaki",
              },
              {
                key: "artists",
                label: "Artists",
                placeholder: "Redice Studio",
              },
              {
                key: "authors",
                label: "Authors",
                placeholder: "Chugong",
              },
              {
                key: "groups",
                label: "Groups",
                placeholder: "Scanlation Team",
              },
              {
                key: "tags",
                label: "Tags",
                placeholder: "Action, Fantasy, Adventure",
              },
            ]
              .filter((field) => {
                if (activeTemplate === "manhwa" && field.label === "Groups") {
                  return false;
                }

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
                <div key={field.key} className="group">
                  {/* Field Label & Top Action */}
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground/80">
                      {field.label}{" "}
                      {field.required && (
                        <span className="text-destructive">*</span>
                      )}
                    </label>

                    {field.key !== "title" && (
                      <button
                        type="button"
                        onClick={() =>
                          openFixModal(
                            field.label,
                            metadata[field.key as keyof typeof metadata],
                          )
                        }
                        className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
                      >
                        <Sparkles className="h-3 w-3" /> Fix
                      </button>
                    )}
                  </div>

                  {/* Input Control */}
                  <input
                    type="text"
                    value={metadata[field.key as keyof typeof metadata]}
                    onChange={(e) =>
                      setMetadata((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              ))}
          </div>
        </section>

        {/* ================= RIGHT: CHAPTERS ================= */}
        <section className="h-fit rounded-3xl border border-slate-200 bg-slate-50/70 p-6 shadow-sm">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <FilePlus className="h-4 w-4 text-indigo-600" />
              Chapters
            </h2>

            <button
              type="button"
              onClick={addChapter}
              className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Add Chapter
            </button>
          </div>

          {/* Chapter Items */}
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
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
                        {/* Header Row */}
                        <div className="mb-4 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            {/* Drag Handle */}
                            <button
                              type="button"
                              {...dragHandleProps}
                              className="cursor-grab rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-400 transition hover:border-indigo-300 hover:bg-white hover:text-indigo-600 active:cursor-grabbing"
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>

                            {/* Chapter Inputs */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-500">
                                Chapter
                              </span>

                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={chapter.main}
                                  onChange={(e) =>
                                    updateChapter(
                                      chapter.id,
                                      "main",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-14 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-semibold text-indigo-600 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                                />

                                <span className="font-bold text-slate-400">
                                  .
                                </span>

                                <input
                                  type="number"
                                  value={chapter.sub}
                                  onChange={(e) =>
                                    updateChapter(
                                      chapter.id,
                                      "sub",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-14 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-semibold text-indigo-600 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3 text-xs">
                            <button
                              type="button"
                              onClick={() => removeChapter(chapter.id)}
                              className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                          {/* Title */}
                          <input
                            type="text"
                            placeholder="Chapter Title"
                            value={chapter.title}
                            onChange={(e) =>
                              updateChapter(chapter.id, "title", e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 sm:col-span-2 md:col-span-2"
                          />

                          {/* Censorship */}
                          <select
                            value={chapter.censorship_id}
                            onChange={(e) =>
                              updateChapter(
                                chapter.id,
                                "censorship_id",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 sm:col-span-1 md:col-span-1"
                          >
                            {censorships.map((censorship) => (
                              <option key={censorship.id} value={censorship.id}>
                                {censorship.name}
                              </option>
                            ))}
                          </select>

                          {/* Language */}
                          <select
                            value={chapter.language}
                            onChange={(e) =>
                              updateChapter(
                                chapter.id,
                                "language",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 sm:col-span-1 md:col-span-1"
                          >
                            {languages.map((language) => (
                              <option key={language.code} value={language.code}>
                                {language.name}
                              </option>
                            ))}
                          </select>

                          {/* Upload Section */}
                          {chapter.pages.length === 0 ? (
                            <label
                              htmlFor={`input-file-chapter-${chapter.id}`}
                              className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-7 text-slate-500 transition duration-200 hover:border-indigo-400 hover:bg-indigo-50/30 hover:text-indigo-600 sm:col-span-2 md:col-span-4"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
                                <Upload className="h-4 w-4" />
                              </div>
                              <div className="text-center">
                                <span className="block text-xs font-semibold text-slate-700">
                                  Upload Chapter Pages
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  JPG, PNG or ZIP • Drag & drop
                                </span>
                              </div>

                              <input
                                type="file"
                                id={`input-file-chapter-${chapter.id}`}
                                accept="image/*,.pdf"
                                className="hidden"
                                multiple
                                onChange={(e) =>
                                  handlePagesChange(e, chapter.id)
                                }
                                onClick={(e) => {
                                  (e.target as HTMLInputElement).value = "";
                                }}
                              />
                            </label>
                          ) : (
                            <div className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 shadow-sm sm:col-span-2 md:col-span-4">
                              <div className="flex min-w-0 items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-white text-indigo-600 shadow-sm">
                                  <ImageIcon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-bold text-slate-800">
                                    Pages Loaded Successfully
                                  </p>
                                  <p className="text-[10px] font-medium text-indigo-600">
                                    {chapter.pages.length} images ready
                                  </p>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenPreview(chapter.id, chapter.pages)
                                  }
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600"
                                >
                                  Manage
                                </button>

                                <label
                                  htmlFor={`replace-file-chapter-${chapter.id}`}
                                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
                                  title="Replace all files"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                  <input
                                    type="file"
                                    id={`replace-file-chapter-${chapter.id}`}
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    multiple
                                    onChange={(e) =>
                                      handlePagesChange(e, chapter.id)
                                    }
                                    onClick={(e) => {
                                      (e.target as HTMLInputElement).value = "";
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </SortableChapter>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      </main>

      {/* Extract Modal */}
      {showExtractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            {/* Header */}
            <div className="border-b border-zinc-800 px-6 py-5">
              <h2 className="text-lg font-bold text-white">
                Extract Comic Metadata
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Paste source URL to automatically extract comic information.
              </p>
            </div>

            {/* Content */}
            <div className="space-y-3 px-6 py-5">
              <label className="block text-sm font-medium text-zinc-300">
                Source URL
              </label>

              <input
                type="url"
                value={extractUrl}
                onChange={(e) => setExtractUrl(e.target.value)}
                placeholder="https://example.com/comic/123"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-zinc-800 px-6 py-5">
              <button
                onClick={() => {
                  setShowExtractModal(false);
                  setExtractUrl("");
                }}
                className="rounded-2xl border border-zinc-800 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleExtract}
                disabled={extracting}
                className="
                  flex items-center gap-2 rounded-2xl
                  bg-indigo-500 px-5 py-3
                  text-sm font-semibold text-white
                  transition hover:bg-indigo-400
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                <Sparkles className="h-4 w-4" />
                {extracting ? "Extracting..." : "Extract"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FIX METADATA MODAL ================= */}
      {fixModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            {/* Header */}
            <div className="border-b border-zinc-800 px-6 py-5">
              <h2 className="text-lg font-bold text-white">
                Fix {fixModal.field}
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Clean and normalize metadata automatically
              </p>
            </div>

            {/* Content */}
            <div className="space-y-5 p-6">
              {/* Raw Input */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Raw Input
                </label>

                <textarea
                  value={fixModal.value}
                  onChange={(e) =>
                    setFixModal((prev) => ({
                      ...prev,
                      value: e.target.value,
                      preview: fixParagraph(e.target.value),
                    }))
                  }
                  rows={6}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 outline-none transition focus:border-indigo-500"
                />
              </div>

              {/* Preview */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Preview Result
                </label>

                <div className="min-h-30 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 text-sm leading-relaxed text-indigo-200">
                  {fixModal.preview || "No preview generated"}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-zinc-800 p-5">
              <button
                onClick={() =>
                  setFixModal({
                    open: false,
                    field: "",
                    value: "",
                    preview: "",
                  })
                }
                className="flex-1 rounded-2xl border border-zinc-800 py-3 text-sm font-semibold text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={saveFixMetadata}
                className="flex-1 rounded-2xl bg-indigo-500 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Save Metadata
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL LIST PAGES UPLOAD ================= */}
      {activeUploadChapterId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-md">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="flex max-h-[90%] w-full max-w-[95%] flex-col rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
              {/* ================= HEADER ================= */}
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-5 py-4">
                {/* Left */}
                <div className="w-24">
                  {tempPages.length > 0 && (
                    <button
                      onClick={() => {
                        tempPages.forEach((p) => URL.revokeObjectURL(p.url));
                        setTempPages([]);
                      }}
                      className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Center */}
                <div className="flex-1 text-center">
                  <h2 className="text-sm font-bold text-zinc-100">
                    Confirm Upload
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    {tempPages.length} selected pages
                  </p>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelUploadedPages}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={saveUploadedPages}
                    className="rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-400 shadow-md"
                  >
                    Save Pages
                  </button>
                </div>
              </div>

              {/* ================= BODY ================= */}
              <div className="max-h-[calc(100vh-180px)] overflow-y-auto p-4 mb-5">
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
                    <label
                      htmlFor="modal-file-append-input"
                      className="group flex aspect-3/4 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 text-zinc-500 transition hover:border-indigo-500 hover:bg-zinc-900/40 hover:text-indigo-400"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 transition group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10">
                        <span className="text-xl font-light">+</span>
                      </div>

                      <div className="text-center">
                        <p className="text-xs font-semibold">Add Pages</p>
                        <p className="mt-1 text-[10px] text-zinc-600">
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
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CROP & ROTATE ================= */}
      {imageSrc && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-md">
          <div className="flex h-200 w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            {/* Header Modal */}
            <div className="border-b border-zinc-800 p-4 text-center font-bold text-zinc-100">
              Adjust Cover Image
            </div>

            {/* Area Kerja Cropper */}
            <div className="relative flex-1 bg-zinc-950">
              <Cropper
                image={imageSrc}
                crop={crop}
                rotation={rotation}
                zoom={zoom}
                aspect={2 / 3} // Menyesuaikan dengan aspek cover asli Anda (aspect-2/3)
                onCropChange={setCrop}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            {/* Panel Kontrol di Bawah Gambar */}
            <div className="space-y-4 border-t border-zinc-800 p-5 bg-zinc-900/60">
              {/* Kontrol Zoom */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-zinc-400">
                  Zoom
                </span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-label="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="h-1 w-full accent-indigo-500 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Kontrol Rotasi */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">
                  Rotation
                </span>
                <button
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 transition hover:border-indigo-500 hover:text-white"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  Rotate 90°
                </button>
              </div>

              {/* Tombol Aksi Akhir */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setImageSrc(null)}
                  className="flex-1 rounded-2xl border border-zinc-800 py-3 text-sm font-semibold text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCroppedImage}
                  className="flex-1 rounded-2xl bg-indigo-500 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                >
                  Apply & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// COMPONENT SORTABLE CHAPTER ITEM
function SortableChapter({
  chapter,
  children,
}: {
  chapter: Chapter;
  children: (props: any) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: chapter.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50" : ""}
    >
      {children({
        dragHandleProps: {
          ...attributes,
          ...listeners,
        },
      })}
    </div>
  );
}

// COMPONENT SORTABLE PAGE CARD
function SortablePageCard({
  file,
  idx,
  onRemove,
}: {
  file: TempPage;
  idx: number;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: file.id,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${isDragging ? 1.03 : 1})`
      : undefined,
    transition: transition || undefined,
    willChange: "transform",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative aspect-3/4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 transition ${
        isDragging
          ? "z-50 scale-[1.03] border-indigo-500 shadow-2xl shadow-indigo-500/20"
          : "hover:border-indigo-500/40"
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute left-2 bottom-2 z-10 flex h-8 w-8 cursor-grab items-center justify-center rounded-lg bg-zinc-950/80 text-zinc-400 backdrop-blur transition hover:text-white active:cursor-grabbing"
      >
        ☰
      </button>

      {/* Page Badge */}
      <span className="absolute left-2 top-2 z-10 rounded-lg bg-zinc-950/90 px-2 py-1 text-[10px] font-bold text-indigo-400 backdrop-blur">
        Page {idx + 1}
      </span>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="absolute right-2 top-2 z-10 rounded-lg bg-red-500/90 p-1.5 text-white opacity-0 shadow-lg backdrop-blur transition hover:bg-red-600 group-hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </button>

      {/* Image */}
      <img
        src={file.url}
        alt={file.name}
        className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
      />

      {/* Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-black/10 opacity-0 transition group-hover:opacity-100" />
    </div>
  );
}
