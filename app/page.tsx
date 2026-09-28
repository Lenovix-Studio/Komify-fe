export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Content from "./content";
import type { HomepageResponse } from "@/types/homePage";
import { BACKEND_URL } from "@/lib/constant";

const isDev = process.env.NODE_ENV === "development";
export const metadata: Metadata = {
  title: `[${isDev ? "DEV" : "PROD"}] Home | Komify`,
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    category?: string;
    status?: string;
    language?: string;
    tags?: string;
    parodies?: string;
    characters?: string;
    authors?: string;
    artists?: string;
    groups?: string;
    sort?: string;
  }>;
}

async function getComics(
  params: Record<string, string | undefined>,
): Promise<HomepageResponse> {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.set(key, value);
  });

  if (!queryParams.has("page")) queryParams.set("page", "1");
  if (!queryParams.has("limit")) queryParams.set("limit", "12");

  try {
    const res = await fetch(`${BACKEND_URL}/comics?${queryParams.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch comics: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching initial comics on server:", error);
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 12,
        has_next: false,
        has_prev: false,
        total_data: 0,
        total_pages: 1,
      },
    };
  }
}

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const initialData = await getComics(resolvedParams);

  return <Content initialData={initialData} initialParams={resolvedParams} />;
}
