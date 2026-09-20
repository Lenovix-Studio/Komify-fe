"use server";

import { ActionResult } from "@/types/uploadPage";
import { BACKEND_URL } from "@/lib/constant";

async function parseError(response: Response, fallback: string) {
  try {
    const errorData = await response.json();
    return errorData?.message || errorData?.error || fallback;
  } catch {
    return fallback;
  }
}

export async function publishComicAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/comics/publish`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      return {
        success: false,
        message: await parseError(response, "Upload failed"),
      };
    }

    const data = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("publishComicAction failed:", error);

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to publish comic",
    };
  }
}

export async function extractMetadataAction(
  url: string,
): Promise<ActionResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/scraper/metadata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: await parseError(response, "Failed to extract metadata"),
      };
    }

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        message: result.message || "Failed to extract metadata",
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("extractMetadataAction failed:", error);

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to extract metadata",
    };
  }
}
