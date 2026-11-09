import { Link, useParams } from "react-router-dom";
import { CATEGORY_IMAGES } from "../api.js";
import StatusMessage from "../components/StatusMessage.jsx";
import PackageReviews from "../components/PackageReviews.jsx";
import { buildItinerary } from "../itinerary.js";
import usePackage from "../hooks/usePackage.js";
import { SERVICE_TAX_RATE } from "../bookings.js";
import useFavorites from "../hooks/useFavorites.js";
import PickupInfo from "../components/PickupInfo.jsx";

// NEW FEATURE 4: Package details page using a dynamic route (/packages/:id).
export default function PackageDetails() {
  const { id } = useParams();
  const { pkg, loading, error } = usePackage(id);
  const { toggleFavorite, isFavorite } = useFavorites();

  return (
    <section className="container section">
      <Link to="/packages" className="back-link">← Back to packages</Link>

      {loading && <StatusMessage type="loading" title="Loading package..." />}
      {error && <StatusMessage type="error" title="Could not load this package.">{error}</StatusMessage>}
      {!loading && !error && !pkg && (
        <StatusMessage type="info" title="Package not found.">This package does not exist. Please go back and choose another one.</StatusMessage>
      )}

      {pkg && (
        <>
        <article className="details">
          <img src={CATEGORY_IMAGES[pkg.category]} alt={`${pkg.category} travel scene for ${pkg.destination}`} />
          <div className="details-body">
            <span className={`badge badge-${pkg.category.toLowerCase()} static`}>{pkg.category}</span>
            <h1>{pkg.destination}</h1>
            <p>{pkg.description}</p>
            <ul className="meta big">
              <li><span>Destination</span><strong>{pkg.destination}</strong></li>
              <li><span>Category</span><strong>{pkg.category}</strong></li>
              <li><span>Duration</span><strong>{pkg.duration}</strong></li>
              <li><span>Price</span><strong className="price">RM {pkg.price.toLocaleString()} / person</strong></li>
              <li><span>Service tax</span><strong>+{SERVICE_TAX_RATE * 100}% added at checkout</strong></li>
            </ul>
            <div className="hero-actions">
              <Link to={`/book/${pkg.id}`} className="btn btn-primary">Book now</Link>
              <button className={isFavorite(pkg.id) ? "btn btn-primary" : "btn btn-outline"} onClick={() => toggleFavorite(pkg.id)} aria-pressed={isFavorite(pkg.id)}>
                {isFavorite(pkg.id) ? "♥ Saved to favourites" : "♡ Add to favourites"}
              </button>
              <Link to="/contact" className="btn btn-outline">Ask about this package</Link>
            </div>
          </div>
        </article>
        <section className="itinerary" aria-labelledby="itinerary-title">
          <h2 id="itinerary-title" className="section-title">Suggested itinerary</h2>
          <ol className="itinerary-list">
            {buildItinerary(pkg).map((d) => (
              <li key={d.day}>
                <strong>Day {d.day}</strong>
                <ul>{d.items.map((it) => <li key={it}>{it}</li>)}</ul>
              </li>
            ))}
          </ol>
          <p className="muted small">Our team confirms the final schedule after you book. Timings may change with weather and local conditions.</p>
        </section>
        <PickupInfo pkg={pkg} />
        <PackageReviews packageId={pkg.id} />
        </>
      )}
    </section>
  );
}