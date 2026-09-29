export const dynamic = "force-dynamic";

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
  const types = await fetchJson<any[]>("/common-code/types");
  const details = await fetchJson<any[]>("/common-code/details");
  const statusType = types.find((t) => t.code === "STATUS");
  const censorshipType = types.find((t) => t.code === "CENSORSHIP");
  const languageType = types.find((t) => t.code === "LANGUAGE");
  const templatesType = types.find((t) => t.code === "TEMPLATE");
  const scraperType = types.find((t) => t.code === "SCRAPER_WEB");

  const statuses: Status[] = details
    .filter((d) => d.type_id === statusType?.id && d.is_active)
    .map((d) => ({ id: d.id, name: d.name }));

  const censorships: Censorship[] = details
    .filter((d) => d.type_id === censorshipType?.id && d.is_active)
    .map((d) => ({ id: d.id, name: d.name }));

  const languages: Language[] = details
    .filter((d) => d.type_id === languageType?.id && d.is_active)
    .map((d) => ({ code: d.code, name: d.name }));
  const templates: Language[] = details
    .filter((d) => d.type_id === templatesType?.id && d.is_active)
    .map((d) => ({ code: d.code, name: d.name }));

  const scrapers = details
    .filter((d) => d.type_id === scraperType?.id && d.is_active)
    .map((d) => ({ code: d.code, name: d.name }));

  return (
    <UploadPageClient
      scrapers={scrapers}
      statuses={statuses}
      censorships={censorships}
      languages={languages}
      templates={templates}
    />
  );
}
