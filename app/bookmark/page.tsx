import { BACKEND_URL } from "@/lib/constant";
import { BookmarkItem } from "@/types/bookmarkPage";
import { BookmarkView } from "./bookmark-view";

async function getBookmarks(): Promise<BookmarkItem[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/bookmarks`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to fetch bookmarks:", res.statusText);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching bookmarks on server:", error);
    return [];
  }
}

export default async function BookmarkPage() {
  const initialBookmarks = await getBookmarks();

  return <BookmarkView initialBookmarks={initialBookmarks} />;
}
