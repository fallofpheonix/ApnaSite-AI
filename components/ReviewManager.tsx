"use client";

import { useEffect, useState } from "react";
import { STATUS_BADGE_CLASS, STATUS_BUTTON_CLASS } from "@/lib/statusStyles";

interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
}

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`h-4 w-4 ${i <= count ? "text-marigold" : "text-ink/15"}`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function ReviewManager({ siteId }: { siteId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/reviews?siteId=${siteId}`);
        if (!res.ok) throw new Error("Failed to load reviews");
        const data = await res.json();
        setReviews(data.reviews ?? []);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [siteId]);

  async function toggleApproval(id: string, approved: boolean) {
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: id, approved }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update review.");
      }
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, approved } : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update review.");
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete review.");
      }
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete review.");
    }
  }

  const totalReviews = reviews.length;
  const pendingCount = reviews.filter((r) => !r.approved).length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : "0.0";

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
        <p className="text-sm text-ink-soft">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-ink/10 bg-card p-5 shadow-sm">
      {error && (
        <div className="rounded-xl border border-brick/20 bg-brick/10 px-4 py-2 text-sm text-brick">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-ink/10 bg-ink/5 p-3 text-center">
          <p className="text-2xl font-bold text-ink">{totalReviews}</p>
          <p className="text-xs text-ink-soft">Total Reviews</p>
        </div>
        <div className="rounded-xl border border-ink/10 bg-ink/5 p-3 text-center">
          <p className="text-2xl font-bold text-ink">{pendingCount}</p>
          <p className="text-xs text-ink-soft">Pending Review</p>
        </div>
        <div className="rounded-xl border border-ink/10 bg-ink/5 p-3 text-center">
          <p className="text-2xl font-bold text-ink">{avgRating}</p>
          <p className="text-xs text-ink-soft">Average Rating</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-ink-soft">No reviews yet.</p>
      ) : (
        <div className="space-y-2">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-ink/10 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{review.author}</span>
                    <Stars count={review.rating} />
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      review.approved ? STATUS_BADGE_CLASS.success : STATUS_BADGE_CLASS.warning
                    }`}>
                      {review.approved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink">{review.comment}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!review.approved && (
                    <button
                      type="button"
                      onClick={() => toggleApproval(review.id, true)}
                      className="rounded-lg bg-teal/10 px-3 py-1.5 text-xs font-medium text-teal transition-colors hover:bg-teal/20"
                    >
                      Approve
                    </button>
                  )}
                  {review.approved && (
                    <button
                      type="button"
                      onClick={() => toggleApproval(review.id, false)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${STATUS_BUTTON_CLASS.warning}`}
                    >
                      Reject
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(review.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${STATUS_BUTTON_CLASS.error}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
