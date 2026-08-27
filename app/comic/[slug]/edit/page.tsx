"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Cropper from "react-easy-crop";
import {
  Upload,
  Save,
  FileText,
  ImageIcon,
  BookOpen,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { getCroppedImg } from "@/lib/cropImage";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

type ComicMetadata = {
  id: string;
  title: string;
  alternative_title: string | null;
  description: string | null;
  legacy_id: number;
  cover_path: string | null;
  total_chapters: number;

  status: {
    id: string;
    name: string;
  };

  category: {
    id: string;
    name: string;
    slug: string;
  };

  tags: {
    id: string;
    name: string;
    slug: string;
  }[];

  parodies: {
    id: string;
    name: string;
    slug: string;
  }[];

  characters: {
    id: string;
    name: string;
    slug: string;
  }[];

  artists: {
    id: string;
    name: string;
    slug: string;
  }[];

  authors: {
    id: string;
    name: string;
    slug: string;
  }[];

  groups: {
    id: string;
    name: string;
    slug: string;
  }[];

  created_at: string;
  updated_at: string;
};
type Status = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};
type Category = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export default function EditComicPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [loadingComic, setLoadingComic] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<string>("");
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [metadata, setMetadata] = useState({
    legacy_id: "",
    title: "",
    alternative_title: "",
    parodies: "",
    characters: "",
    artists: "",
    authors: "",
    groups: "",
    tags: "",
    description: "",
    status_id: "",
    category: "",
  });
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

  // Fetch CommonData
  useEffect(() => {
    const fetchCommonData = async () => {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

        const [statusRes, categoryRes] = await Promise.all([
          fetch(`${baseUrl}/system/statuses`),
          fetch(`${baseUrl}/system/categories`),
        ]);

        if (!statusRes.ok) throw new Error("Failed to fetch statuses");
        if (!categoryRes.ok) throw new Error("Failed to fetch categories");

        const [statusData, categoryData]: [Status[], Category[]] =
          await Promise.all([statusRes.json(), categoryRes.json()]);

        setStatuses(statusData);
        setCategories(categoryData);
      } catch (error) {
        console.error("Failed to fetch common data:", error);
      }
    };

    fetchCommonData();
  }, []);

  // Fetch Comic Metadata
  useEffect(() => {
    const fetchComic = async () => {
      try {
        setLoadingComic(true);
        const baseUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
        const response = await fetch(`${baseUrl}/comics/${slug}/metadata`, {
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Failed to fetch comic metadata");

        const data: ComicMetadata = await response.json();

        // Set category template secara otomatis dari data backend
        const categorySlug =
          data.category?.slug?.toLowerCase() ||
          data.category?.name?.toLowerCase() ||
          "doujinshi";
        setActiveTemplate(categorySlug);

        setMetadata({
          legacy_id: String(data.legacy_id || ""),
          title: data.title || "",
          alternative_title: data.alternative_title || "",
          parodies: data.parodies?.map((x) => x.name).join(", ") || "",
          characters: data.characters?.map((x) => x.name).join(", ") || "",
          artists: data.artists?.map((x) => x.name).join(", ") || "",
          authors: data.authors?.map((x) => x.name).join(", ") || "",
          groups: data.groups?.map((x) => x.name).join(", ") || "",
          tags: data.tags?.map((x) => x.name).join(", ") || "",
          description: data.description || "",
          status_id: data.status?.id || "",
          category: data.category?.id || "",
        });

        setCoverImage(data.cover_path ? `${baseUrl}${data.cover_path}` : null);
      } catch (error) {
        console.error("Fetch comic error:", error);
      } finally {
        setLoadingComic(false);
      }
    };

    if (slug) fetchComic();
  }, [slug]);

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
      const baseUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

      const selectedCategory = categories.find(
        (c) => c.slug.toLowerCase() === activeTemplate.toLowerCase(),
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
        category: selectedCategory?.id || metadata.category,
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
        }),
      );
      if (coverFile) {
        formData.append("cover", coverFile);
      }

      const response = await fetch(`${baseUrl}/comics/${slug}`, {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to update comic");
      }

      alert("Comic updated successfully");
      router.push(`/comic/${slug}`);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save comic");
    } finally {
      setIsSaving(false);
    }
  };

  const [comicCategory, setComicCategory] = useState("");
  const generateFixPreview = () => {
    setFixModal((prev) => ({
      ...prev,
      preview: fixParagraph(prev.value),
    }));
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
  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  if (loadingComic) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading comic editor...</p>
      </main>
    );
  }

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
            {categories.map((category) => {
              // Membandingkan slug kategori dengan activeTemplate
              const isActive = activeTemplate === category.slug.toLowerCase();

              return (
                <Button
                  key={category.id}
                  type="button"
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTemplate(category.slug.toLowerCase())}
                  className={`h-7 rounded-lg px-3 text-xs font-medium capitalize transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {category.name}
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

              {/* Hover Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 backdrop-blur-[2px] transition duration-200 group-hover:opacity-100">
                <span className="flex items-center gap-1.5 rounded-xl border border-border bg-background/90 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {coverImage ? "Edit Image" : "Choose File"}
                </span>
              </div>
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
      {imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-md">
          <div className="flex h-200 w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            <div className="border-b border-zinc-800 p-4 text-center font-bold text-zinc-100">
              Adjust Cover Image
            </div>

            <div className="relative flex-1 bg-zinc-950">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={2 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Controls */}
            <div className="space-y-4 border-t border-zinc-800 bg-zinc-900/60 p-5">
              {/* Zoom */}
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
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-indigo-500"
                />
              </div>

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
    </>
  );
}
