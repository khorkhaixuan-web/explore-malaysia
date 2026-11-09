// Read-only stars. Props: value (0-5, may be decimal), count (optional number of reviews)
export default function StarRating({ value, count }) {
  const filled = Math.round(value);
  return (
    <span className="stars" role="img" aria-label={`${value ? value.toFixed(1) : 0} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= filled ? "star on" : "star"} aria-hidden="true">★</span>
      ))}
      {count !== undefined && <span className="stars-count">{value ? value.toFixed(1) : "–"} ({count})</span>}
    </span>
  );
}
