import { CATEGORY_IMAGES } from "../api.js";
import { SERVICE_TAX_RATE, formatDate, formatRM, priceBreakdown, tripEndDate } from "../bookings.js";
import { formatTime } from "../pickup.js";

// Order summary card shown next to the booking form and the payment form.
// Props: pkg-like data { destination, category, duration, pricePerPerson }, travellers, travelDate (optional),
// pickup (optional) = { name, time }
export default function BookingSummary({ destination, category, duration, pricePerPerson, travellers, travelDate, promoCode = "", pickup = null }) {
  const { gross, groupPercent, groupDiscount, promoCode: appliedPromo, promoDiscount, subtotal, tax, total } = priceBreakdown(pricePerPerson, travellers, promoCode);
  return (
    <aside className="summary" aria-label="Booking summary">
      <img src={CATEGORY_IMAGES[category]} alt="" />
      <div className="summary-body">
        <h2>{destination}</h2>
        <p className="muted">{duration}</p>
        <ul className="meta">
          <li><span>Start date</span><strong>{travelDate ? formatDate(travelDate) : "Not chosen yet"}</strong></li>
          <li><span>End date</span><strong>{travelDate ? formatDate(tripEndDate(travelDate, duration)) : "-"}</strong></li>
          <li><span>Pick-up point</span><strong>{pickup?.name || "Not chosen yet"}</strong></li>
          <li><span>Pick-up time</span><strong>{pickup?.time ? formatTime(pickup.time) : "-"}</strong></li>
          <li><span>Price per person</span><strong>{formatRM(pricePerPerson)}</strong></li>
          <li><span>Travellers</span><strong>× {travellers}</strong></li>
          {(groupDiscount > 0 || promoDiscount > 0) && <li><span>Package price</span><strong>{formatRM(gross)}</strong></li>}
          {groupDiscount > 0 && <li className="discount"><span>Group discount ({groupPercent}%)</span><strong>- {formatRM(groupDiscount)}</strong></li>}
          {promoDiscount > 0 && <li className="discount"><span>Promo {appliedPromo}</span><strong>- {formatRM(promoDiscount)}</strong></li>}
          <li><span>Subtotal</span><strong>{formatRM(subtotal)}</strong></li>
          <li><span>Service tax ({SERVICE_TAX_RATE * 100}%)</span><strong>{formatRM(tax)}</strong></li>
        </ul>
        <div className="summary-total">
          <span>Total</span>
          <strong>{formatRM(total)}</strong>
        </div>
      </div>
    </aside>
  );
}