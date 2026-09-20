import type { Metadata } from "next";
import Content from "./content";
import type { HomepageResponse } from "@/types/homePage";

export const metadata: Metadata = {
  title: "Home | Komify",
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

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  try {
    const res = await fetch(`${backendUrl}/comics?${queryParams.toString()}`, {
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
