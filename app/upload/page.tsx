import { Status, Censorship, Language } from "@/types/uploadPage";
import UploadPageClient from "./content";
import { Metadata } from "next";
import { BACKEND_URL } from "@/lib/constant";

export const metadata: Metadata = {
  title: "Upload",
};

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export default async function UploadPage() {
  const [statuses, censorships, languages] = await Promise.all([
    fetchJson<Status[]>("/system/statuses"),
    fetchJson<Censorship[]>("/system/censorships"),
    fetchJson<Language[]>("/system/languages"),
  ]);

  return (
    <UploadPageClient
      statuses={statuses}
      censorships={censorships}
      languages={languages}
    />
  );
}
