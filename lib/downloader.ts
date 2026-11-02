import JSZip from "jszip";
import { BACKEND_URL } from "./constant";
import { toast } from "sonner";

export async function downloadFileAsBlob(url: string): Promise<Blob> {
  const fullUrl = url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  const response = await fetch(fullUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image from ${fullUrl}`);
  }
  return response.blob();
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadChapterAsZip(
  chapterId: string,
  chapterNumber: string,
  comicTitle: string,
) {
  const toastId = toast.loading(`Preparing Chapter ${chapterNumber}...`);
  try {
    const res = await fetch(`${BACKEND_URL}/chapters/${chapterId}`);
    if (!res.ok) throw new Error("Failed to fetch chapter details");
    const data = await res.json();
    const pages: { filepath: string; page_number: number }[] = data.pages || [];

    if (pages.length === 0) {
      toast.error("No pages found in this chapter", { id: toastId });
      return;
    }

    const zip = new JSZip();
    const folderName = `Ch_${chapterNumber}`;
    const folder = zip.folder(folderName) || zip;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      toast.loading(
        `Downloading Chapter ${chapterNumber} (${i + 1}/${pages.length})...`,
        { id: toastId },
      );
      const blob = await downloadFileAsBlob(page.filepath);
      const ext = page.filepath.split(".").pop()?.split("?")[0] || "jpg";
      const filename = `${String(page.page_number).padStart(3, "0")}.${ext}`;
      folder.file(filename, blob);
    }

    toast.loading("Zipping chapter pages...", { id: toastId });
    const content = await zip.generateAsync({ type: "blob" });
    const cleanComicTitle = comicTitle.replace(/[/\\?%*:|"<>]/g, "_");
    triggerBlobDownload(
      content,
      `${cleanComicTitle} - Ch_${chapterNumber}.zip`,
    );
    toast.success(`Chapter ${chapterNumber} downloaded successfully!`, {
      id: toastId,
    });
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || "Failed to download chapter", { id: toastId });
  }
}

export async function downloadFullComicAsZip(
  comic: any,
  chapters: { id: string; chapter_number: string }[],
) {
  if (!chapters || chapters.length === 0) {
    toast.error("No chapters available to download");
    return;
  }

  const toastId = toast.loading(`Preparing comic download...`);
  try {
    const zip = new JSZip();
    const cleanComicTitle = (comic.title || "Comic").replace(
      /[/\\?%*:|"<>]/g,
      "_",
    );

    zip.file("metadata.json", JSON.stringify(comic, null, 2));

    if (comic.cover_path) {
      try {
        toast.loading("Downloading cover image...", { id: toastId });
        const coverBlob = await downloadFileAsBlob(comic.cover_path);
        const ext = comic.cover_path.split(".").pop()?.split("?")[0] || "jpg";
        zip.file(`cover.${ext}`, coverBlob);
      } catch (e) {
        console.warn("Failed to download cover image for zip", e);
      }
    }

    for (let cIdx = 0; cIdx < chapters.length; cIdx++) {
      const ch = chapters[cIdx];
      toast.loading(
        `Processing Chapter ${ch.chapter_number} (${cIdx + 1}/${chapters.length})...`,
        { id: toastId },
      );

      const res = await fetch(`${BACKEND_URL}/chapters/${ch.id}`);
      if (!res.ok) continue;
      const data = await res.json();
      const pages: { filepath: string; page_number: number }[] =
        data.pages || [];

      const folderName = `Ch_${ch.chapter_number}`;
      const folder = zip.folder(folderName) || zip;

      for (let pIdx = 0; pIdx < pages.length; pIdx++) {
        const page = pages[pIdx];
        const blob = await downloadFileAsBlob(page.filepath);
        const ext = page.filepath.split(".").pop()?.split("?")[0] || "jpg";
        const filename = `${String(page.page_number).padStart(3, "0")}.${ext}`;
        folder.file(filename, blob);
      }
    }

    toast.loading("Generating full comic ZIP file...", { id: toastId });
    const content = await zip.generateAsync({ type: "blob" });
    triggerBlobDownload(content, `${cleanComicTitle}.zip`);
    toast.success(`Comic downloaded successfully!`, { id: toastId });
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || "Failed to download comic", { id: toastId });
  }
}
