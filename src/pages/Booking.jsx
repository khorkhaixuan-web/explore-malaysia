import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import usePackage from "../hooks/usePackage.js";
import FormField from "../components/FormField.jsx";
import StatusMessage from "../components/StatusMessage.jsx";
import BookingSteps from "../components/BookingSteps.jsx";
import BookingSummary from "../components/BookingSummary.jsx";
import TermsContent from "../components/TermsContent.jsx";
import { buildPickup, formatTime, getPickupOptions, validatePickup } from "../pickup.js";
import { GROUP_DISCOUNTS, MAX_TRAVELLERS, createBooking, findPromo, isMalaysianMobile, maxTravelDate, minTravelDate, MIN_DAYS_AHEAD } from "../bookings.js";

// Step 1 of 3: choose the travel date and number of travellers, accept the Terms & Conditions.
export default function Booking() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pkg, loading, error } = usePackage(id);

  const [form, setForm] = useState({
    travelDate: "",
    travellers: "1",
    pickupPoint: "",
    pickupTime: "",
    contactName: user.profile.fullName || "",
    contactPhone: user.profile.phone || "",
    notes: "",
  });
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState(""); // the applied code
  const [promoMsg, setPromoMsg] = useState(null); // { ok, text }

  const minDate = minTravelDate();
  const maxDate = maxTravelDate();
  const travellers = Math.min(MAX_TRAVELLERS, Math.max(1, parseInt(form.travellers, 10) || 1));
  const pickupOptions = getPickupOptions(pkg);
  const selectedPoint = pickupOptions.find((p) => p.id === form.pickupPoint);

  const validate = () => {
    const found = {};
    if (!form.travelDate) found.travelDate = "Please choose your travel date.";
    else if (form.travelDate < minDate) found.travelDate = `Travel date must be at least ${MIN_DAYS_AHEAD} days from today.`;
    else if (form.travelDate > maxDate) found.travelDate = "Travel date cannot be more than 12 months ahead.";

    const count = Number(form.travellers);
    if (!Number.isInteger(count) || count < 1 || count > MAX_TRAVELLERS) found.travellers = `Choose between 1 and ${MAX_TRAVELLERS} travellers.`;

    const { pointError, timeError } = validatePickup(pkg, form.pickupPoint, form.pickupTime);
    if (pointError) found.pickupPoint = pointError;
    if (timeError) found.pickupTime = timeError;

    if (!form.contactName.trim()) found.contactName = "Lead traveller name is required.";
    if (!form.contactPhone.trim()) found.contactPhone = "Phone number is required.";
    else if (!isMalaysianMobile(form.contactPhone)) found.contactPhone = "Enter a valid Malaysian mobile number, e.g. 012-3456789.";

    if (!accepted) found.accepted = "You must agree to the Terms & Conditions to continue.";
    return found;
  };

  const applyPromo = () => {
    const found = findPromo(promoInput);
    if (!promoInput.trim()) return setPromoMsg({ ok: false, text: "Enter a promo code first." });
    if (!found) {
      setPromo("");
      return setPromoMsg({ ok: false, text: "This promo code is not valid." });
    }
    setPromo(found.code);
    setPromoMsg({ ok: true, text: `Code ${found.code} applied: ${found.label}.` });
  };

  const removePromo = () => {
    setPromo("");
    setPromoInput("");
    setPromoMsg(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // changing the pick-up point clears the pick-up time, because every point has its own times
    setForm(name === "pickupPoint" ? { ...form, pickupPoint: value, pickupTime: "" } : { ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: undefined });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const booking = createBooking({
      userEmail: user.email,
      pkg,
      travelDate: form.travelDate,
      travellers: Number(form.travellers),
      pickup: buildPickup(pkg, form.pickupPoint, form.pickupTime),
      contactName: form.contactName.trim(),
      contactPhone: form.contactPhone.trim(),
      notes: form.notes.trim(),
      promoCode: promo,
    });
    navigate(`/payment/${booking.id}`);
  };

  return (
    <section className="container section">
      <Link to={`/packages/${id}`} className="back-link">← Back to package</Link>
      <h1 className="page-title">Book your trip</h1>
      <BookingSteps current={1} />

      {loading && <StatusMessage type="loading" title="Loading package..." />}
      {error && <StatusMessage type="error" title="Could not load this package.">{error}</StatusMessage>}
      {!loading && !error && !pkg && (
        <StatusMessage type="info" title="Package not found.">This package does not exist. <Link to="/packages">Choose another package</Link>.</StatusMessage>
      )}

      {pkg && (
        <div className="booking-layout">
          <form className="form" onSubmit={handleSubmit} noValidate>
            <h2>Trip details</h2>
            <div className="form-row">
              <FormField id="travelDate" label="Travel date" type="date" min={minDate} max={maxDate} value={form.travelDate} onChange={handleChange} error={errors.travelDate} />
              <FormField id="travellers" label="Number of travellers" type="number" min="1" max={MAX_TRAVELLERS} inputMode="numeric" value={form.travellers} onChange={handleChange} error={errors.travellers} />
            </div>

            <h2>Pick-up point &amp; time</h2>
            <div className="form-row">
              <FormField id="pickupPoint" label="Pick-up point" as="select" value={form.pickupPoint} onChange={handleChange} error={errors.pickupPoint}>
                <option value="">Choose a pick-up point</option>
                {pickupOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </FormField>
              <FormField id="pickupTime" label="Pick-up time" as="select" value={form.pickupTime} onChange={handleChange} error={errors.pickupTime} disabled={!selectedPoint}>
                <option value="">{selectedPoint ? "Choose a pick-up time" : "Choose a pick-up point first"}</option>
                {selectedPoint?.times.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
              </FormField>
            </div>
            {selectedPoint && <p className="muted small">Meeting place: {selectedPoint.address}. Please arrive 15 minutes early. Pick-up is on your start date.</p>}

            <h2>Lead traveller</h2>
            <div className="form-row">
              <FormField id="contactName" label="Full name" autoComplete="name" value={form.contactName} onChange={handleChange} error={errors.contactName} />
              <FormField id="contactPhone" label="Phone number" type="tel" placeholder="012-3456789" autoComplete="tel" value={form.contactPhone} onChange={handleChange} error={errors.contactPhone} />
            </div>
            <FormField id="notes" label="Special requests (optional)" as="textarea" rows="3" placeholder="Dietary needs, allergies, mobility needs..." maxLength={300} value={form.notes} onChange={handleChange} />

            <h2>Discounts</h2>
            <p className="muted small">Group discount: {GROUP_DISCOUNTS.slice().reverse().map((g) => `${g.min}+ travellers ${g.percent}% off`).join(", ")}. It is applied automatically.</p>
            <div className="promo-row">
              <FormField id="promo" label="Promo code (optional)" placeholder="e.g. WELCOME10" value={promoInput} disabled={!!promo} onChange={(e) => setPromoInput(e.target.value)} />
              {promo ? (
                <button type="button" className="btn btn-outline" onClick={removePromo}>Remove</button>
              ) : (
                <button type="button" className="btn btn-outline" onClick={applyPromo}>Apply</button>
              )}
            </div>
            {promoMsg && <p className={promoMsg.ok ? "promo-ok" : "error-text"} role="status">{promoMsg.text}</p>}

            <h2>Terms &amp; Conditions</h2>
            <details className="terms-box">
              <summary>Read the Terms &amp; Conditions</summary>
              <div className="terms-scroll" tabIndex={0} aria-label="Terms and Conditions text">
                <TermsContent />
              </div>
            </details>
            <div className={errors.accepted ? "check has-error" : "check"}>
              <input
                id="accepted"
                name="accepted"
                type="checkbox"
                checked={accepted}
                aria-invalid={!!errors.accepted}
                aria-describedby={errors.accepted ? "accepted-error" : undefined}
                onChange={(e) => {
                  setAccepted(e.target.checked);
                  if (errors.accepted) setErrors({ ...errors, accepted: undefined });
                }}
              />
              <label htmlFor="accepted">
                I have read and agree to the <Link to="/terms" target="_blank">Terms &amp; Conditions</Link>, including the cancellation and refund policy.
              </label>
            </div>
            {errors.accepted && <span id="accepted-error" className="error-text">{errors.accepted}</span>}

            <button type="submit" className="btn btn-primary">Continue to payment</button>
          </form>

          <BookingSummary
            destination={pkg.destination}
            category={pkg.category}
            duration={pkg.duration}
            pricePerPerson={pkg.price}
            travellers={travellers}
            travelDate={form.travelDate && form.travelDate >= minDate && form.travelDate <= maxDate ? form.travelDate : ""}
            promoCode={promo}
            pickup={selectedPoint ? { name: selectedPoint.name, time: form.pickupTime } : null}
          />
        </div>
      )}
    </section>
  );
}