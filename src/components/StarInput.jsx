import { useState } from "react";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

// Clickable 1-5 star chooser. Props: value, onChange(number), error
export default function StarInput({ value, onChange, error }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className={error ? "field has-error" : "field"}>
      <span className="label" id="rating-label">Your rating</span>
      <div className="star-input" role="radiogroup" aria-labelledby="rating-label" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""} - ${LABELS[n]}`}
            className={n <= shown ? "star-btn on" : "star-btn"}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
          >
            ★
          </button>
        ))}
        <span className="star-text">{shown ? LABELS[shown] : "Tap a star"}</span>
      </div>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
