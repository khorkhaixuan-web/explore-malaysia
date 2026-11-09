import { useMemo } from "react";
import MediaView from "./MediaView.jsx";
import StarRating from "./StarRating.jsx";
import { formatDate, getReviewsForPackage, getRatingSummary } from "../bookings.js";

// Public reviews for one package. Props: packageId
export default function PackageReviews({ packageId }) {
  const reviews = useMemo(() => getReviewsForPackage(packageId), [packageId]);
  const { average, count } = useMemo(() => getRatingSummary(packageId), [packageId]);

  return (
    <section className="reviews" aria-labelledby="reviews-title">
      <h2 id="reviews-title" className="section-title">Traveller reviews</h2>
      {count === 0 ? (
        <p className="muted">No reviews yet. Book this trip and be the first to share your experience.</p>
      ) : (
        <>
          <div className="reviews-summary">
            <strong className="reviews-avg">{average.toFixed(1)}</strong>
            <div>
              <StarRating value={average} />
              <p className="muted small">Based on {count} review{count > 1 ? "s" : ""}</p>
            </div>
          </div>
          <ul className="review-list">
            {reviews.map((r) => (
              <li key={r.id} className="review-card">
                <div className="review-head">
                  <strong>{r.name}</strong>
                  <StarRating value={r.rating} />
                </div>
                {r.comment && <p className="review-text">{r.comment}</p>}
                {r.media?.length > 0 && (
                  <div className="media-grid">
                    {r.media.map((m) => <MediaView key={m.id} item={m} />)}
                  </div>
                )}
                <p className="muted small">Travelled {formatDate(r.travelDate)}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
