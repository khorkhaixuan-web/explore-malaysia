import { formatTime, getPickupOptions } from "../pickup.js";

// NEW FEATURE: shows every pick-up point and its pick-up times for one package (used on the package details page).
export default function PickupInfo({ pkg }) {
  const options = getPickupOptions(pkg);
  return (
    <section className="pickup" aria-labelledby="pickup-title">
      <h2 id="pickup-title" className="section-title">Pick-up points &amp; times</h2>
      <ul className="pickup-list">
        {options.map((point) => (
          <li key={point.id}>
            <strong>{point.name}</strong>
            <span className="muted small">{point.address}</span>
            <div className="time-chips" aria-label={`Pick-up times at ${point.name}`}>
              {point.times.map((t) => <span key={t} className="time-chip">{formatTime(t)}</span>)}
            </div>
          </li>
        ))}
      </ul>
      <p className="muted small">Pick-up is on the first day of your trip. You choose your point and time when you book.</p>
    </section>
  );
}