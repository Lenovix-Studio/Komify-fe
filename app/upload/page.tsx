import { Status, Censorship, Language } from "@/types/uploadPage";
import UploadPageClient from "./content";
import { Metadata } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

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
