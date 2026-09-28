export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { BACKEND_URL } from "@/lib/constant";
import CreateChapterContent from "./content";

export default async function CreateChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let nextChapterNumber = "001";
  let languages: any[] = [];
  let censorships: any[] = [];

  try {
    const [chaptersRes, typesRes, detailsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/comics/${slug}/chapters`, {
        cache: "no-store",
      }),
      fetch(`${BACKEND_URL}/common-code/types`, { cache: "no-store" }),
      fetch(`${BACKEND_URL}/common-code/details`, { cache: "no-store" }),
    ]);

    if (!chaptersRes.ok) {
      return notFound();
    }

    const chaptersData = await chaptersRes.json();
    nextChapterNumber = String(chaptersData.total_chapters + 1).padStart(
      3,
      "0",
    );

    if (typesRes.ok && detailsRes.ok) {
      const types = await typesRes.json();
      const details = await detailsRes.json();

      const langType = types.find((t: any) => t.code === "LANGUAGE");
      const cenType = types.find((t: any) => t.code === "CENSORSHIP");

      if (langType) {
        languages = details
          .filter((d: any) => d.type_id === langType.id && d.is_active)
          .map((d: any) => ({
            id: d.id,
            name: d.name,
            code: d.code.toLowerCase(),
          }))
          .sort((a: any, b: any) => a.sort_order - b.sort_order);
      }

      if (cenType) {
        censorships = details
          .filter((d: any) => d.type_id === cenType.id && d.is_active)
          .map((d: any) => ({
            id: d.id,
            name: d.name,
            code: d.code,
          }))
          .sort((a: any, b: any) => a.sort_order - b.sort_order);
      }
    }
  } catch (error) {
    console.error("Failed to fetch initial data", error);
    return notFound();
  }

  return (
    <CreateChapterContent
      slug={slug}
      initialNextChapterNumber={nextChapterNumber}
      initialLanguages={languages}
      initialCensorships={censorships}
    />
  );
}
