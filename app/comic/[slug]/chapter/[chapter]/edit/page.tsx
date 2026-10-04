export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { BACKEND_URL } from "@/lib/constant";
import ChapterEditContent from "./content";

async function getChapterWithMetadata(chapterId: string) {
  const [chapterRes, typesRes, detailsRes] = await Promise.all([
    fetch(`${BACKEND_URL}/chapters/${chapterId}`, {
      cache: "no-store",
    }),
    fetch(`${BACKEND_URL}/common-code/types`, { cache: "no-store" }),
    fetch(`${BACKEND_URL}/common-code/details`, { cache: "no-store" }),
  ]);

  if (!chapterRes.ok) {
    return null;
  }

  const chapterData = await chapterRes.json();
  let languages: any[] = [];
  let censorships: any[] = [];

  try {
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
    console.error("Failed to fetch types/details", error);
  }

  return { chapterData, languages, censorships };
}

export default async function EditChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>;
}) {
  const { slug, chapter: chapterId } = await params;

  try {
    const result = await getChapterWithMetadata(chapterId);
    if (!result) {
      return notFound();
    }

    const { chapterData, languages, censorships } = result;

    return (
      <ChapterEditContent
        slug={slug}
        chapterId={chapterId}
        initialChapterData={chapterData}
        languages={languages}
        censorships={censorships}
      />
    );
  } catch (error) {
    console.error("Failed to load edit chapter page", error);
    return notFound();
  }
}
