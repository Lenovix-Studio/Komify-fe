"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ImageCropModal } from "@/app/upload/components/ImageCropModal";
import {
  Upload,
  Save,
  FileText,
  ImageIcon,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { getCroppedImg } from "@/lib/cropImage";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OptionItem } from "@/types/uploadPage";
import { BACKEND_URL } from "@/lib/constant";

export default function EditComicClient({
  slug,
  initialComic,
  statuses,
  templates,
}: {
  slug: string;
  initialComic: any;
  statuses: OptionItem[];
  templates: OptionItem[];
}) {
  const router = useRouter();

  const categorySlug =
    initialComic?.category?.slug?.toLowerCase() ||
    initialComic?.category?.name?.toLowerCase() ||
    templates[0]?.code ||
    "manga";

  const initialStatusName = initialComic?.status?.name?.toLowerCase() || "";
  const matchedStatus = statuses.find(
    (s) => s.name.toLowerCase() === initialStatusName,
  );
  const initialStatusId = matchedStatus?.id || statuses[0]?.id || "";

  const [activeTemplate, setActiveTemplate] = useState<string>(categorySlug);
  const [isSaving, setIsSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [metadata, setMetadata] = useState({
    legacy_id: String(initialComic?.legacy_id || ""),
    title: initialComic?.title || "",
    alternative_title: initialComic?.alternative_title || "",
    parodies: initialComic?.parodies?.map((x: any) => x.name).join(", ") || "",
    characters:
      initialComic?.characters?.map((x: any) => x.name).join(", ") || "",
    artists: initialComic?.artists?.map((x: any) => x.name).join(", ") || "",
    authors: initialComic?.authors?.map((x: any) => x.name).join(", ") || "",
    groups: initialComic?.groups?.map((x: any) => x.name).join(", ") || "",
    tags: initialComic?.tags?.map((x: any) => x.name).join(", ") || "",
    description: initialComic?.description || "",
    status_id: initialStatusId,
    status_name: matchedStatus?.name || initialComic?.status?.name || "",
  });
  const [coverImage, setCoverImage] = useState<string | null>(
    initialComic?.cover_path
      ? `${BACKEND_URL}${initialComic.cover_path}`
      : null,
  );

  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [savedCrop, setSavedCrop] = useState({ x: 0, y: 0 });
  const [savedRotation, setSavedRotation] = useState(0);
  const [savedZoom, setSavedZoom] = useState(1);
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

  // Clean Paragraph Utility
  const fixParagraph = useCallback((text: any) => {
    if (!text) return "";
    let result = Array.isArray(text) ? text.join(", ") : String(text);
    result = result.replace(/[|♀♂•−]/g, ",");
    result = result.replace(/\s+\d+(\.\d+)?[km]?/gi, ",");
    const parts = result
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    return [...new Set(parts)].join(", ");
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
      [fixModal.field]: fixModal.preview,
    }));
    setFixModal({ open: false, field: "", value: "", preview: "" });
  };

  // Image Upload & Crop Handlers
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const resultStr = reader.result as string;
        setImageSrc(resultStr);
        setOriginalSrc(resultStr);
        setCrop({ x: 0, y: 0 });
        setRotation(0);
        setZoom(1);
      });
      reader.readAsDataURL(file);
    }
  };

  const skipCrop = async () => {
    if (!originalSrc) return;
    setCoverImage(originalSrc);
    const response = await fetch(originalSrc);
    const blob = await response.blob();
    const file = new File([blob], "cover.jpg", {
      type: blob.type || "image/jpeg",
    });
    setCoverFile(file);
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
      if (!cropped) throw new Error("Failed to crop image");

      setCoverImage(cropped);
      const response = await fetch(cropped);
      const blob = await response.blob();
      const file = new File([blob], "cover.jpg", {
        type: blob.type || "image/jpeg",
      });
      setCoverFile(file);

      setSavedCrop(crop);
      setSavedRotation(rotation);
      setSavedZoom(zoom);
      setImageSrc(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Handler
  const handleSave = async () => {
    try {
      setIsSaving(true);

      const selectedCategory = templates.find(
        (c) => c.code?.toLowerCase() === activeTemplate.toLowerCase(),
      );

      const payloadMetadata: Record<string, any> = {
        title: metadata.title,
        alternative_title: metadata.alternative_title || null,
        description: metadata.description || null,
        parodies: metadata.parodies,
        characters: metadata.characters,
        artists: metadata.artists,
        tags: metadata.tags,
        status_id: metadata.status_id,
        category: selectedCategory?.id || activeTemplate,
      };

      if (activeTemplate === "manhwa") {
        payloadMetadata.authors = metadata.authors;
        payloadMetadata.groups = "";
      } else {
        payloadMetadata.groups = metadata.groups;
        payloadMetadata.authors = "";
      }

      const formData = new FormData();
      formData.append(
        "document",
        JSON.stringify({
          template: activeTemplate,
          metadata: payloadMetadata,
          cover_removed: coverImage === null && !coverFile,
        }),
      );
      if (coverFile) {
        formData.append("cover", coverFile);
      }

      const response = await fetch(`${BACKEND_URL}/comics/${slug}`, {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to update comic");
      }

      toast.success("Comic updated successfully");
      router.push(`/comic/${slug}`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save comic",
      );
    } finally {
      setIsSaving(false);
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
  const onCropComplete = (croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  return (
    <>
      <Header
        logo={false}
        showSearch={false}
        showRandom={false}
        leftContent={
          <Button
            variant="ghost"
            asChild
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            <Link href={`/comic/${slug}`}>Cancel</Link>
          </Button>
        }
        centerContent={
          <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-card p-1 shadow-xs">
            {templates.map((template) => {
              // Membandingkan code template dengan activeTemplate
              const isActive = activeTemplate === template.code?.toLowerCase();

              return (
                <Button
                  key={template.id}
                  type="button"
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() =>
                    setActiveTemplate(template.code?.toLowerCase() || "")
                  }
                  className={`h-7 rounded-lg px-3 text-xs font-medium capitalize transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {template.name}
                </Button>
              );
            })}
          </div>
        }
        rightContent={
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            <Save className={`h-4 w-4 ${isSaving ? "animate-spin" : ""}`} />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      <div className="mx-auto max-w-7xl grid grid-cols-1 gap-6 lg:grid-cols-12 mt-6">
        {/* ================= COLUMN 1: COVER (3 cols) ================= */}
        <div className="lg:col-span-3">
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

            {/* Hidden File Input */}
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

            {/* Upload Dropzone / Image Preview */}
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
                      WEBP, JPG, atau PNG
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {coverImage && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("cover-upload")?.click()
                  }
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

            {/* Publication Status Selector */}
            <div className="mt-5 space-y-1.5 border-t border-border/60 pt-4">
              <label className="block text-xs font-semibold text-foreground/80">
                Publication Status <span className="text-destructive">*</span>
              </label>
              <select
                value={metadata.status_id}
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
        </div>

        {/* ================= COLUMN 2: METADATA (5 cols) ================= */}
        <div className="lg:col-span-5">
          <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm transition-all">
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
                    Kelola informasi detail karya
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">
                  ID:
                </span>
                <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                  #{metadata.legacy_id}
                </span>
              </div>
            </div>

            {/* Form Inputs Container */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                  Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={metadata.title}
                  onChange={(e) =>
                    setMetadata({ ...metadata, title: e.target.value })
                  }
                  placeholder="Masukkan judul utama"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Alternative Title */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground/80">
                  Alternative Title
                </label>
                <input
                  type="text"
                  value={metadata.alternative_title}
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      alternative_title: e.target.value,
                    })
                  }
                  placeholder="Judul alternatif (opsional)"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Dynamic Metadata Fields */}
              {[
                { label: "Parodies", key: "parodies", show: true },
                { label: "Characters", key: "characters", show: true },
                { label: "Artists", key: "artists", show: true },
                {
                  label: "Authors",
                  key: "authors",
                  show: activeTemplate === "manhwa",
                },
                {
                  label: "Groups",
                  key: "groups",
                  show: activeTemplate !== "manhwa",
                },
                { label: "Tags", key: "tags", show: true },
              ]
                .filter((f) => f.show)
                .map((field) => (
                  <div key={field.key} className="group">
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground/80">
                        {field.label}
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          openFixModal(
                            field.key,
                            metadata[field.key as keyof typeof metadata],
                          )
                        }
                        className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
                      >
                        <Sparkles className="h-3 w-3" /> Auto Clean
                      </button>
                    </div>
                    <input
                      type="text"
                      value={metadata[field.key as keyof typeof metadata]}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          [field.key]: e.target.value,
                        })
                      }
                      placeholder="Dipisahkan dengan koma (contoh: item1, item2)"
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                ))}
            </div>
          </section>
        </div>

        {/* ================= COLUMN 3: SYNOPSIS (4 cols) ================= */}
        <div className="lg:col-span-4">
          <section className="flex h-full flex-col rounded-3xl border border-border/80 bg-card p-6 shadow-sm transition-all">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Synopsis
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Deskripsi & ringkasan cerita
                  </p>
                </div>
              </div>

              {/* Character Counter */}
              <span className="font-mono text-[11px] text-muted-foreground">
                {metadata.description?.length || 0} karakter
              </span>
            </div>

            {/* Textarea Input */}
            <div className="relative flex flex-1 flex-col">
              <textarea
                rows={16}
                placeholder="Tuliskan sinopsis atau deskripsi lengkap di sini..."
                value={metadata.description}
                onChange={(e) =>
                  setMetadata((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full flex-1 resize-none rounded-2xl border border-input bg-background p-4 text-xs font-normal text-foreground leading-relaxed transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </section>
        </div>
      </div>

      {/* ================= FIX MODAL ================= */}
      {fixModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            <div className="border-b border-zinc-800 px-6 py-4">
              <h2 className="text-lg font-bold text-white">
                Fix {fixModal.field}
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Clean metadata automatically
              </p>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Raw Metadata
                </label>

                <textarea
                  rows={6}
                  value={fixModal.value}
                  onChange={(e) => {
                    const value = e.target.value;

                    setFixModal((prev) => ({
                      ...prev,
                      value,
                      preview: fixParagraph(value),
                    }));
                  }}
                  placeholder="Paste raw metadata here..."
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-sm text-zinc-200 outline-none transition focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="mb-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Preview
                  </label>
                </div>

                <div className="min-h-32 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm leading-7 text-zinc-300">
                  {fixModal.preview || (
                    <span className="text-zinc-600">Preview result...</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-zinc-800 p-5">
              <button
                onClick={() => setFixModal({ ...fixModal, open: false })}
                className="flex-1 rounded-2xl border border-zinc-800 py-3 text-sm font-semibold text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  saveFixMetadata();
                }}
                className="flex-1 rounded-2xl bg-indigo-500 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Apply Fix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CROP ================= */}
      <ImageCropModal
        imageSrc={imageSrc}
        setImageSrc={setImageSrc}
        rotation={rotation}
        setRotation={setRotation}
        onCropComplete={onCropComplete}
        saveCroppedImage={saveCroppedImage}
        skipCrop={skipCrop}
      />
    </>
  );
}
