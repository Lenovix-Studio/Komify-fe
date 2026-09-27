"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { BACKEND_URL } from "@/lib/constant";
import { toast } from "sonner";

interface RatingWidgetProps {
  comicId: string;
  initialScore: number;
  initialCount: number;
}

export function RatingWidget({
  comicId,
  initialScore,
  initialCount,
}: RatingWidgetProps) {
  const [ratingScore, setRatingScore] = useState(initialScore);
  const [ratingCount, setRatingCount] = useState(initialCount);
  const [hovered, setHovered] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const handleRate = async (rating: number) => {
    if (hasRated || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/comics/${comicId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit rating");
      }

      const { data } = await res.json();
      setRatingScore(data.rating_score);
      setRatingCount(data.rating_count);
      setHasRated(true);

      try {
        toast.success("Thank you for rating!");
      } catch {
        alert("Thank you for rating!");
      }
    } catch (error) {
      console.error(error);
      try {
        toast.error("Failed to submit rating");
      } catch {
        alert("Failed to submit rating");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 mt-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={isSubmitting || hasRated}
              onMouseEnter={() => !hasRated && setHovered(star)}
              onMouseLeave={() => !hasRated && setHovered(0)}
              onClick={() => handleRate(star)}
              className="p-1 transition-transform hover:scale-110 disabled:cursor-default disabled:hover:scale-100"
            >
              <Star
                className={`h-5 w-5 transition-colors ${
                  (hovered || ratingScore) >= star
                    ? "fill-amber-400 text-amber-400"
                    : "fill-muted text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <span>{ratingScore > 0 ? ratingScore.toFixed(1) : "0.0"}</span>
          <span className="text-xs font-normal text-muted-foreground">
            ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
          </span>
        </div>
      </div>
      {hasRated && (
        <span className="text-[10px] text-muted-foreground ml-1">
          You rated this comic
        </span>
      )}
    </div>
  );
}
