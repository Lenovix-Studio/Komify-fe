import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BACKEND_URL } from "@/lib/constant";
import { ComicChaptersResponse, ComicMetadata } from "@/types/detailPage";
import { ComicDetailView } from "./comic-detail-view";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getComicMetadata(slug: string): Promise<ComicMetadata | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/comics/${slug}/metadata`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching comic metadata:", error);
    return null;
  }
}

async function getComicChapters(
  slug: string,
): Promise<ComicChaptersResponse | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/comics/${slug}/chapters`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching comic chapters:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const comic = await getComicMetadata(slug);

  if (!comic) {
    return {
      title: "Comic Not Found | Komify",
    };
  }

  return {
    title: `${comic.title}`,
    description: comic.description || `Read ${comic.title} on Komify`,
    openGraph: {
      title: comic.title,
      description: comic.description || undefined,
      images: comic.cover_path ? [`${BACKEND_URL}${comic.cover_path}`] : [],
    },
  };
}

export default async function ComicDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const [comic, chaptersData] = await Promise.all([
    getComicMetadata(slug),
    getComicChapters(slug),
  ]);

  if (!comic) {
    notFound();
  }

  return (
    <ComicDetailView
      initialComic={comic}
      initialChapters={chaptersData?.data ?? []}
      slug={slug}
    />
  );
}
