import { formatRM } from "../bookings.js";

// DEMO of the page a customer sees on their own bank's website after choosing FPX.
// In a real shop this page belongs to the bank and opens after a redirect.
// Props: bankName, amount, bookingId, busy, onApprove(), onCancel()
export default function BankGateway({ bankName, amount, bookingId, busy, onApprove, onCancel }) {
  return (
    <div className="bank-gateway" role="region" aria-label={`${bankName} secure payment page (demo)`}>
      <div className="bank-head">
        <strong>{bankName}</strong>
        <span className="bank-secure">🔒 Secure online banking · DEMO</span>
      </div>
      <ul className="meta">
        <li><span>Merchant</span><strong>Explore Malaysia</strong></li>
        <li><span>Reference</span><strong>{bookingId}</strong></li>
        <li><span>Amount</span><strong className="price">{formatRM(amount)}</strong></li>
      </ul>
      <p className="muted small">This is a practice page, so no username or password is needed. In real life you would log in to your bank here and approve the transfer.</p>
      <div className="hero-actions">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={onApprove}>{busy ? "Confirming..." : "Approve payment"}</button>
        <button type="button" className="btn btn-outline" disabled={busy} onClick={onCancel}>Cancel and go back</button>
      </div>
    </div>
  );
}