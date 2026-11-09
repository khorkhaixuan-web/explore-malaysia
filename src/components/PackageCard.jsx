import { Link } from "react-router-dom";
import { CATEGORY_IMAGES } from "../api.js";
import StarRating from "./StarRating.jsx";
import { getRatingSummary } from "../bookings.js";

// Reusable card for ONE travel package.
// Props: pkg (data from the API), isFavorite (boolean), onToggleFavorite (function)
export default function PackageCard({ pkg, isFavorite, onToggleFavorite }) {
  const { average, count } = getRatingSummary(pkg.id);
  return (
    <article className="card">
      <div className="card-img">
        <img src={CATEGORY_IMAGES[pkg.category]} alt={`${pkg.category} travel scene for ${pkg.destination}`} loading="lazy" />
        <span className={`badge badge-${pkg.category.toLowerCase()}`}>{pkg.category}</span>
        <button
          className={isFavorite ? "fav active" : "fav"}
          onClick={() => onToggleFavorite(pkg.id)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Remove ${pkg.destination} from favourites` : `Add ${pkg.destination} to favourites`}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>

      <div className="card-body">
        <h3>{pkg.destination}</h3>
        {count > 0 ? <StarRating value={average} count={count} /> : <span className="muted small">No reviews yet</span>}
        <ul className="meta">
          <li><span>Category</span><strong>{pkg.category}</strong></li>
          <li><span>Duration</span><strong>{pkg.duration}</strong></li>
          <li><span>Price</span><strong className="price">RM {pkg.price.toLocaleString()} <small className="muted">/ person + 6% tax</small></strong></li>
        </ul>
        <div className="card-actions">
          <Link className="btn btn-outline" to={`/packages/${pkg.id}`}>View details</Link>
          <Link className="btn btn-primary" to={`/book/${pkg.id}`}>Book now</Link>
        </div>
      </div>
    </article>
  );
}
