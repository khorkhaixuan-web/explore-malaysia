import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import StatusMessage from "../components/StatusMessage.jsx";
import ReviewSection from "../components/ReviewSection.jsx";
import BookingSteps from "../components/BookingSteps.jsx";
import { downloadTicket } from "../ticket.js";
import { formatTime } from "../pickup.js";
import { STATUS_LABELS, bookingBreakdown, cancelBooking, formatDate, formatDateTime, formatRM, getBooking, refundAmount, refundRule, tripEndDate } from "../bookings.js";

// Step 3 of 3: booking confirmation / receipt. Also used to view and cancel a booking later.
export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(() => getBooking(bookingId, user.email));
  const [confirming, setConfirming] = useState(false);

  if (!booking) {
    return (
      <section className="container section narrow">
        <StatusMessage type="error" title="Booking not found.">We could not find this booking in your account.</StatusMessage>
        <Link to="/my-bookings" className="btn btn-outline">My bookings</Link>
      </section>
    );
  }

  const isPaid = booking.status === "paid";
  const rule = refundRule(booking);
  const refund = refundAmount(booking);
  const { gross, groupDiscount, promoCode, promoDiscount, subtotal, tax } = bookingBreakdown(booking);
  const [ticketBusy, setTicketBusy] = useState(false);
  const [ticketError, setTicketError] = useState("");

  const handleTicket = async () => {
    setTicketBusy(true);
    setTicketError("");
    try {
      await downloadTicket(booking);
    } catch {
      setTicketError("Could not create the e-ticket. Please try again.");
    } finally {
      setTicketBusy(false);
    }
  };

  const handleCancel = () => {
    setBooking(cancelBooking(booking.id));
    setConfirming(false);
  };

  return (
    <section className="container section narrow">
      <h1 className="page-title">{isPaid ? "Booking confirmed" : "Booking details"}</h1>
      {booking.status !== "cancelled" && booking.status !== "expired" && <BookingSteps current={isPaid ? 3 : 2} />}

      {isPaid && (
        <StatusMessage type="success" title="Thank you! Your payment was successful.">
          Your trip to {booking.destination} is confirmed. Keep your booking reference for check-in.
        </StatusMessage>
      )}
      {booking.status === "pending" && (
        <StatusMessage type="info" title="Payment not completed yet.">Your booking is reserved until {formatDateTime(booking.expiresAt)}.</StatusMessage>
      )}
      {booking.status === "expired" && <StatusMessage type="error" title="This booking expired.">Payment was not made within 30 minutes.</StatusMessage>}
      {booking.status === "cancelled" && (
        <StatusMessage type="info" title="This booking was cancelled.">
          {booking.refund > 0
            ? `A refund of ${formatRM(booking.refund)} will be returned to your original payment method${booking.payment?.method ? ` (${booking.payment.method})` : ""} within 7 to 14 working days.`
            : isPaid || booking.payment ? "This cancellation is not eligible for a refund." : "No payment was taken."}
        </StatusMessage>
      )}

      <article className="receipt">
        <header className="receipt-head">
          <div>
            <span className="muted small">Booking reference</span>
            <p className="receipt-ref">{booking.id}</p>
          </div>
          <span className={`pill pill-${booking.status}`}>{STATUS_LABELS[booking.status]}</span>
        </header>

        <ul className="meta big">
          <li><span>Package</span><strong>{booking.destination}</strong></li>
          <li><span>Duration</span><strong>{booking.duration}</strong></li>
          <li><span>Start date</span><strong>{formatDate(booking.travelDate)}</strong></li>
          <li><span>End date</span><strong>{formatDate(booking.endDate || tripEndDate(booking.travelDate, booking.duration))}</strong></li>
          {booking.pickup && (
            <>
              <li><span>Pick-up point</span><strong>{booking.pickup.name}</strong></li>
              <li><span>Pick-up address</span><strong>{booking.pickup.address}</strong></li>
              <li><span>Pick-up time</span><strong>{formatTime(booking.pickup.time)} on {formatDate(booking.travelDate)}</strong></li>
            </>
          )}
          <li><span>Travellers</span><strong>{booking.travellers}</strong></li>
          <li><span>Lead traveller</span><strong>{booking.contactName} · {booking.contactPhone}</strong></li>
          {booking.notes && <li><span>Special requests</span><strong>{booking.notes}</strong></li>}
          <li><span>Price</span><strong>{formatRM(booking.pricePerPerson)} × {booking.travellers}</strong></li>
          {(groupDiscount > 0 || promoDiscount > 0) && <li><span>Package price</span><strong>{formatRM(gross)}</strong></li>}
          {groupDiscount > 0 && <li><span>Group discount</span><strong>- {formatRM(groupDiscount)}</strong></li>}
          {promoDiscount > 0 && <li><span>Promo {promoCode}</span><strong>- {formatRM(promoDiscount)}</strong></li>}
          {booking.tax !== undefined && (
            <>
              <li><span>Subtotal</span><strong>{formatRM(subtotal)}</strong></li>
              <li><span>Service tax ({Math.round(booking.serviceTaxRate * 100)}%)</span><strong>{formatRM(tax)}</strong></li>
            </>
          )}
          <li><span>Total</span><strong className="price">{formatRM(booking.total)}</strong></li>
          {booking.payment && (
            <>
              <li><span>Payment method</span><strong>{booking.payment.method} ({booking.payment.account})</strong></li>
              <li><span>Payment reference</span><strong>{booking.payment.reference}</strong></li>
              <li><span>Paid on</span><strong>{formatDateTime(booking.payment.paidAt)}</strong></li>
            </>
          )}
          <li><span>Terms accepted</span><strong>Version {booking.terms.version}, {formatDateTime(booking.terms.acceptedAt)}</strong></li>
        </ul>

        <div className="hero-actions no-print">
          {booking.status === "pending" && <Link to={`/payment/${booking.id}`} className="btn btn-primary">Continue to payment</Link>}
          {isPaid && <button type="button" className="btn btn-primary" onClick={handleTicket} disabled={ticketBusy}>{ticketBusy ? "Preparing..." : "Download e-ticket (PDF)"}</button>}
          {isPaid && <button type="button" className="btn btn-outline" onClick={() => window.print()}>Print receipt</button>}
          <Link to="/my-bookings" className="btn btn-outline">My bookings</Link>
          <Link to="/packages" className="btn btn-outline">Browse more packages</Link>
        </div>
      </article>

      {ticketError && <StatusMessage type="error" title={ticketError} />}
      {isPaid && <p className="muted small no-print">A confirmation e-mail was added to your <Link to="/inbox">Inbox</Link>.</p>}

      <ReviewSection key={booking.id} booking={booking} onChange={setBooking} />

      {isPaid && (
        <div className="cancel-box no-print">
          {!confirming ? (
            <button type="button" className="btn-link" onClick={() => setConfirming(true)}>Cancel this booking</button>
          ) : (
            <StatusMessage type="info" title="Cancel this booking?">
              Cancelling {rule.label} gives a {rule.percent}% refund
              {rule.percent > 0 ? ` (${formatRM(refund)})` : ""}. This cannot be undone.
            </StatusMessage>
          )}
          {confirming && (
            <div className="hero-actions">
              <button type="button" className="btn btn-primary" onClick={handleCancel}>Yes, cancel booking</button>
              <button type="button" className="btn btn-outline" onClick={() => setConfirming(false)}>Keep my booking</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}