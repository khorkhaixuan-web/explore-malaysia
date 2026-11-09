import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import StarRating from "../components/StarRating.jsx";
import StatusMessage from "../components/StatusMessage.jsx";
import { STATUS_LABELS, formatDate, formatRM, getBookingsFor, tripEndDate } from "../bookings.js";

export default function MyBookings() {
  const { user } = useAuth();
  const bookings = getBookingsFor(user.email);

  return (
    <section className="container section narrow">
      <h1 className="page-title">My bookings</h1>
      <p className="page-sub">Your trips and payment status.</p>

      {bookings.length === 0 ? (
        <>
          <StatusMessage type="info" title="No bookings yet.">When you book a package it will appear here.</StatusMessage>
          <Link to="/packages" className="btn btn-primary">Browse packages</Link>
        </>
      ) : (
        <ul className="booking-list">
          {bookings.map((b) => (
            <li key={b.id} className="booking-item">
              <div>
                <h2>{b.destination}</h2>
                <p className="muted">
                  {formatDate(b.travelDate)} to {formatDate(b.endDate || tripEndDate(b.travelDate, b.duration))} · {b.travellers} traveller{b.travellers > 1 ? "s" : ""} · {formatRM(b.total)}
                </p>
                <p className="small muted">Ref: {b.id}</p>
                {b.status === "paid" && (b.review ? <StarRating value={b.review.rating} /> : <Link className="small" to={`/bookings/${b.id}`}>★ Rate this trip</Link>)}
              </div>
              <div className="booking-item-side">
                <span className={`pill pill-${b.status}`}>{STATUS_LABELS[b.status]}</span>
                <Link to={b.status === "pending" ? `/payment/${b.id}` : `/bookings/${b.id}`} className="btn btn-outline">
                  {b.status === "pending" ? "Pay now" : "View"}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
