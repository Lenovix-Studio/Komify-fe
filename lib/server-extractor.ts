import { SCARPER_URL } from "./constant";

export async function extractFileViaScraper(file: File): Promise<File[]> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${SCARPER_URL}/api/v1/extract`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to extract file on scraper");
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error("Extraction failed");
  }

  const extractedFiles: File[] = [];

  for (const page of data.pages) {
    const res = await fetch(`data:${page.mime_type};base64,${page.base64}`);
    const blob = await res.blob();
    extractedFiles.push(
      new File([blob], page.filename, { type: page.mime_type }),
    );
  }

  return extractedFiles;
}
