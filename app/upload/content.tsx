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
  HelpCircle,
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
import { extractMetadataAction } from "./actions/actions";
import { BACKEND_URL } from "@/lib/constant";
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
  templates: { code: string; name: string }[];
  scrapers: { code: string; name: string }[];
};

export default function UploadPageClient({
  statuses,
  censorships,
  languages,
  templates,
  scrapers,
}: UploadPageClientProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
  const [tempPages, setTempPages] = useState<TempPage[]>([]);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extractUrls, setExtractUrls] = useState<string[]>([""]);
  const [extracting, setExtracting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [scraperCode, setScraperCode] = useState<string>(
    scrapers.length > 0 ? scrapers[0].code : "",
  );
  const [activeUploadChapterId, setActiveUploadChapterId] = useState<
    string | null
  >(null);
  const [activeTemplate, setActiveTemplate] = useState<string>(
    templates[0]?.code || "doujinshi",
  );
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isPublishing) {
      document.title = "Uploading...";
    } else {
      document.title = "Upload | Komify";
    }
  }, [isPublishing]);

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
      const currentTemplate = activeTemplate?.toLowerCase();
      if (currentTemplate === "manhwa") {
        delete cleanMetadata.groups;
      }
      if (currentTemplate === "doujinshi" || currentTemplate === "manga") {
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
      // REQUEST with Progress
      // =========================
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${BACKEND_URL}/comics/publish`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100,
            );
            setUploadProgress(percentComplete);
            toast.loading(`Uploading comic... ${percentComplete}%`, {
              id: toastId,
            });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              toast.success("Comic published successfully!", { id: toastId });
              setTimeout(() => {
                window.location.href = "/";
              }, 1500);
              resolve(result);
            } catch (e) {
              reject(new Error("Invalid server response"));
            }
          } else {
            let msg = "Upload failed";
            try {
              msg = JSON.parse(xhr.responseText).message || msg;
            } catch (e) {}
            reject(new Error(msg));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(formData);
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to publish comic";
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsPublishing(false);
      setUploadProgress(0);
    }
  };

  // FIX PARAGRAPH MODAL
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

  // COVER IMAGE
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
  const skipCrop = () => {
    if (!originalSrc) return;
    setCoverImage(originalSrc);
    setImageSrc(null);
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
      const defaultLanguage = languages[0]?.code || "en";
      return [
        ...prev,
        {
          id: uuidv7(),
          main: lastMain + 1,
          sub: 0,
          title: "",
          censorship_id: defaultCensorshipId,
          language: defaultLanguage,
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

  // PAGES MANAGEMENT
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
  const handleExtract = async () => {
    const validUrls = extractUrls.filter((u) => u.trim() !== "");
    if (validUrls.length === 0) {
      toast.error("Please enter at least one valid URL");
      return;
    }

    const toastId = toast.loading("Extracting metadata...");

    try {
      setExtracting(true);

      let mergedData: any = {};
      const newChapters: Chapter[] = [];
      let baseLength = chapters.length;
      if (
        chapters.length === 1 &&
        chapters[0].title === "" &&
        chapters[0].pages.length === 0
      ) {
        baseLength = 0;
      }

      for (let i = 0; i < validUrls.length; i++) {
        const url = validUrls[i].trim();
        const result = await extractMetadataAction(url, scraperCode);
        if (!result.success || !result.data) {
          throw new Error(
            result.message || `Failed to extract metadata from ${url}`,
          );
        }

        const data = result.data;

        if (i === 0) {
          mergedData.title = data.title || "";
          mergedData.alternative_title = data.alternative_title || "";
          mergedData.parodies = Array.isArray(data.parodies)
            ? data.parodies
            : [];
          mergedData.characters = Array.isArray(data.characters)
            ? data.characters
            : [];
          mergedData.artists = Array.isArray(data.artists) ? data.artists : [];
          mergedData.groups = Array.isArray(data.groups) ? data.groups : [];
          mergedData.tags = Array.isArray(data.tags) ? data.tags : [];
        } else {
          if (Array.isArray(data.parodies))
            mergedData.parodies.push(...data.parodies);
          if (Array.isArray(data.characters))
            mergedData.characters.push(...data.characters);
          if (Array.isArray(data.artists))
            mergedData.artists.push(...data.artists);
          if (Array.isArray(data.groups))
            mergedData.groups.push(...data.groups);
          if (Array.isArray(data.tags)) mergedData.tags.push(...data.tags);
        }

        const chapTitle = url;

        newChapters.push({
          id: crypto.randomUUID(),
          title: chapTitle,
          main: baseLength + i + 1,
          sub: 0,
          censorship_id: censorships.length > 0 ? censorships[0].id : "",
          language: languages.length > 0 ? languages[0].code : "",
          pages: [],
        });
      }

      mergedData.parodies = [...new Set(mergedData.parodies)].join(", ");
      mergedData.characters = [...new Set(mergedData.characters)].join(", ");
      mergedData.artists = [...new Set(mergedData.artists)].join(", ");
      mergedData.groups = [...new Set(mergedData.groups)].join(", ");
      mergedData.tags = [...new Set(mergedData.tags)].join(", ");

      setMetadata((prev) => ({
        ...prev,
        title: mergedData.title || prev.title,
        alternative_title:
          mergedData.alternative_title || prev.alternative_title,
        parodies: mergedData.parodies || prev.parodies,
        characters: mergedData.characters || prev.characters,
        artists: mergedData.artists || prev.artists,
        groups: mergedData.groups || prev.groups,
        tags: mergedData.tags || prev.tags,
      }));

      setChapters((prev) => {
        let currentChapters = [...prev];
        if (
          currentChapters.length === 1 &&
          currentChapters[0].title === "" &&
          currentChapters[0].pages.length === 0
        ) {
          currentChapters = [];
        }
        return [...currentChapters, ...newChapters];
      });

      setShowExtractModal(false);
      setExtractUrls([""]);

      toast.success("Metadata extracted successfully!", { id: toastId });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to extract metadata";
      toast.error(errorMessage, { id: toastId });
    } finally {
      setExtracting(false);
    }
  };

  const handleButtonClick = () => {
    if (!isConfirming) {
      setIsConfirming(true);
      setTimeout(() => setIsConfirming(false), 4000);
    } else {
      setIsConfirming(false);
      handlePublish();
    }
  };

  if (!isMounted) {
    return null;
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
            {templates.map((item) => {
              const isActive = activeTemplate === item.code;
              return (
                <Button
                  key={item.code}
                  type="button"
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTemplate(item.code)}
                  className={`h-7 rounded-lg px-3 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
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
              onClick={handleButtonClick}
              disabled={isPublishing}
              className={`gap-2 rounded-xl shadow-xs transition-colors disabled:opacity-50 ${
                isConfirming
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {isPublishing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isConfirming ? (
                <HelpCircle className="h-3.5 w-3.5" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}

              <span>
                {isPublishing
                  ? uploadProgress < 100
                    ? `Uploading... ${uploadProgress}%`
                    : "Processing..."
                  : isConfirming
                    ? "Upload new comic?"
                    : "Publish Comic"}
              </span>
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
                  const currentTpl = activeTemplate?.toLowerCase();
                  if (currentTpl === "manhwa" && field.label === "Groups")
                    return false;
                  if (
                    (currentTpl === "doujinshi" || currentTpl === "manga") &&
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
                      Chapters ({sortedChapters.length})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Manage {sortedChapters.length} comic chapters and pages
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
        onClose={() => setShowExtractModal(false)}
        extractUrls={extractUrls}
        setExtractUrls={setExtractUrls}
        scraperCode={scraperCode}
        setScraperCode={setScraperCode}
        onExtract={handleExtract}
        isExtracting={extracting}
        scrapers={scrapers}
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
        skipCrop={skipCrop}
      />
    </div>
  );
}
