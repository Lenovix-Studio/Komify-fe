import { notFound } from "next/navigation";
import EditComicClient from "./content";
import { OptionItem } from "@/types/uploadPage";
import { BACKEND_URL } from "@/lib/constant";

export const dynamic = "force-dynamic";

export default async function EditComicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let comicData = null;
  let statuses: OptionItem[] = [];
  let templates: OptionItem[] = [];

  try {
    const [comicRes, typesRes, ccRes] = await Promise.all([
      fetch(`${BACKEND_URL}/comics/${slug}/metadata`, {
        cache: "no-store",
      }),
      fetch(`${BACKEND_URL}/common-code/types`, { cache: "no-store" }),
      fetch(`${BACKEND_URL}/common-code/details`, { cache: "no-store" }),
    ]);

    if (!comicRes.ok) return notFound();
    comicData = await comicRes.json();

    if (ccRes.ok && typesRes.ok) {
      const types = await typesRes.json();
      const details = await ccRes.json();

      const statusType = types.find((t: any) => t.code === "STATUS");
      const templatesType = types.find(
        (t: any) => t.code === "TEMPLATE" || t.code === "TYPE_CONTENT",
      );

      statuses = details
        .filter((d: any) => d.type_id === statusType?.id && d.is_active)
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((d: any) => ({
          id: d.id,
          name: d.name,
          code: d.code.toLowerCase(),
        }));

      templates = details
        .filter((d: any) => d.type_id === templatesType?.id && d.is_active)
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((d: any) => ({
          id: d.id,
          name: d.name,
          code: d.code.toLowerCase(),
        }));
    }
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return notFound();
  }

  return (
    <EditComicClient
      slug={slug}
      initialComic={comicData}
      statuses={statuses}
      templates={templates}
    />
  );
}
