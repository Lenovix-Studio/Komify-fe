import { BACKEND_URL } from "@/lib/constant";
import { HistoryItem } from "@/types/historyPage";
import { HistoryView } from "./history-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reading History | Komify",
};

async function getHistories(): Promise<HistoryItem[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/history`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to fetch histories:", res.statusText);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching histories on server:", error);
    return [];
  }
}

export default async function HistoryPage() {
  const initialHistories = await getHistories();

  return <HistoryView initialHistories={initialHistories} />;
}
