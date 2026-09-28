export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { BACKEND_URL } from "@/lib/constant";
import ChapterReaderContent from "./content";
import { ChapterDetail } from "@/types/chapterPage";

export default async function ChapterReaderPage({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>;
}) {
  const { slug, chapter: chapterId } = await params;

  let chapter: ChapterDetail | null = null;
  let allChapters: { id: string; chapter_number: string }[] = [];

  try {
    const [chapterRes, allChaptersRes] = await Promise.all([
      fetch(`${BACKEND_URL}/chapters/${chapterId}`, {
        cache: "no-store",
      }),
      fetch(`${BACKEND_URL}/comics/${slug}/chapters`, {
        cache: "no-store",
      }),
    ]);

    if (!chapterRes.ok) {
      return notFound();
    }

    chapter = await chapterRes.json();

    if (allChaptersRes.ok) {
      const chaptersResponse = await allChaptersRes.json();
      allChapters = chaptersResponse.data.map((c: any) => ({
        id: c.id,
        chapter_number: c.chapter_number,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch chapter data", error);
    return notFound();
  }

  return (
    <ChapterReaderContent
      slug={slug}
      chapterId={chapterId}
      initialChapter={chapter!}
      initialAllChapters={allChapters}
    />
  );
}
