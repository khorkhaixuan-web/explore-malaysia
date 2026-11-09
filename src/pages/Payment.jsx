import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import FormField from "../components/FormField.jsx";
import StatusMessage from "../components/StatusMessage.jsx";
import BookingSteps from "../components/BookingSteps.jsx";
import BookingSummary from "../components/BookingSummary.jsx";
import PaymentMethodPicker from "../components/PaymentMethodPicker.jsx";
import CardForm from "../components/CardForm.jsx";
import BankGateway from "../components/BankGateway.jsx";
import { cancelBooking, formatRM, getBooking, isMalaysianMobile, markExpired, markPaid } from "../bookings.js";
import { BANKS, PAYMENT_DEMO_MODE, payWithBank, payWithCard, payWithTng, validateCard } from "../payment.js";

const mmss = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

const EMPTY_CARD = { cardType: "credit", name: "", number: "", expiry: "", cvv: "" };

// Step 2 of 3: pay by credit/debit card, online banking (FPX) or Touch 'n Go eWallet.
export default function Payment() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(() => getBooking(bookingId, user.email));
  const [method, setMethod] = useState("card"); // card | fpx | tng
  const [card, setCard] = useState(EMPTY_CARD);
  const [cardErrors, setCardErrors] = useState({});
  const [bank, setBank] = useState("");
  const [bankError, setBankError] = useState("");
  const [showGateway, setShowGateway] = useState(false); // FPX: the "bank website" step
  const [phone, setPhone] = useState(booking?.contactPhone || "");
  const [phoneError, setPhoneError] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [now, setNow] = useState(Date.now());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Countdown for the 30-minute hold on an unpaid booking.
  useEffect(() => {
    if (!booking || booking.status !== "pending") return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [booking]);

  const remaining = booking ? booking.expiresAt - now : 0;
  useEffect(() => {
    if (booking?.status === "pending" && remaining <= 0 && !paying) setBooking(markExpired(booking.id));
  }, [booking, remaining, paying]);

  if (!booking) {
    return (
      <section className="container section narrow">
        <StatusMessage type="error" title="Booking not found.">We could not find this booking in your account.</StatusMessage>
        <Link to="/my-bookings" className="btn btn-outline">My bookings</Link>
      </section>
    );
  }

  if (booking.status === "paid") return <Navigate to={`/bookings/${booking.id}`} replace />;

  if (booking.status !== "pending") {
    return (
      <section className="container section narrow">
        <h1 className="page-title">Payment</h1>
        <StatusMessage type="info" title={booking.status === "expired" ? "This booking has expired." : "This booking was cancelled."}>
          {booking.status === "expired" ? "Unpaid bookings are held for 30 minutes. Please make a new booking." : "No payment is needed."}
        </StatusMessage>
        <Link to={`/book/${booking.packageId}`} className="btn btn-primary">Book again</Link>
      </section>
    );
  }

  const changeMethod = (id) => {
    setMethod(id);
    setPayError("");
    setCardErrors({});
    setBankError("");
    setPhoneError("");
  };

  // CardForm sends only the fields that changed; also clear the error of those fields.
  const updateCard = (patch) => {
    setCard((c) => ({ ...c, ...patch }));
    setCardErrors((errs) => {
      const next = { ...errs };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
    setPayError("");
  };

  // Run a payment function, then mark the booking as paid or show why it failed.
  const finishPayment = async (request, methodName) => {
    setPayError("");
    setPaying(true);
    try {
      const result = await request();
      if (!result.ok) throw new Error(result.error || "Payment was not approved.");
      markPaid(booking.id, { reference: result.reference, method: methodName, account: result.account });
      navigate(`/bookings/${booking.id}`, { replace: true });
    } catch (err) {
      if (mounted.current) {
        setPayError(err.message || "Payment failed. Please try again.");
        setCard((c) => ({ ...c, cvv: "" })); // never keep the CVV after a failed attempt
        setShowGateway(false);
        setPaying(false);
      }
    }
  };

  const handlePay = (e) => {
    e.preventDefault();

    if (method === "card") {
      const errors = validateCard(card);
      setCardErrors(errors);
      if (Object.keys(errors).length > 0) return;
      finishPayment(() => payWithCard({ bookingId: booking.id, amount: booking.total, card }), card.cardType === "credit" ? "Credit card" : "Debit card");
    } else if (method === "fpx") {
      if (!bank) return setBankError("Please choose your bank.");
      setBankError("");
      setShowGateway(true); // next step: the bank's own page
    } else {
      if (!phone.trim()) return setPhoneError("Enter your TNG eWallet mobile number.");
      if (!isMalaysianMobile(phone)) return setPhoneError("Enter a valid Malaysian mobile number, e.g. 012-3456789.");
      setPhoneError("");
      finishPayment(() => payWithTng({ bookingId: booking.id, amount: booking.total, phone }), "Touch 'n Go eWallet");
    }
  };

  const handleCancel = () => {
    cancelBooking(booking.id);
    navigate("/my-bookings");
  };

  const payLabel = {
    card: `Pay ${formatRM(booking.total)}`,
    fpx: "Continue to your bank",
    tng: `Pay ${formatRM(booking.total)} with TNG eWallet`,
  }[method];

  return (
    <section className="container section">
      <h1 className="page-title">Payment</h1>
      <BookingSteps current={2} />

      <div className="booking-layout">
        {method === "fpx" && showGateway ? (
          <div className="form">
            <h2>Confirm with your bank</h2>
            <BankGateway
              bankName={bank}
              amount={booking.total}
              bookingId={booking.id}
              busy={paying}
              onApprove={() => finishPayment(() => payWithBank({ bookingId: booking.id, amount: booking.total, bank }), "FPX online banking")}
              onCancel={() => setShowGateway(false)}
            />
            <p className="hold-note">Your booking is held for <strong>{mmss(remaining)}</strong>. Please complete payment before the time runs out.</p>
          </div>
        ) : (
          <form className="form" onSubmit={handlePay} noValidate>
            <h2>Pay with</h2>

            {PAYMENT_DEMO_MODE && (
              <StatusMessage type="info" title="Demo payment">
                This is a practice checkout. No real money will be charged.
                {method === "card" && " Test card: 4242 4242 4242 4242, any future expiry, any 3-digit CVV. A card ending 0002 is declined."}
              </StatusMessage>
            )}
            {payError && <StatusMessage type="error" title="Payment failed">{payError}</StatusMessage>}

            <PaymentMethodPicker value={method} onChange={changeMethod} disabled={paying} />

            {method === "card" && <CardForm card={card} errors={cardErrors} onChange={updateCard} disabled={paying} />}

            {method === "fpx" && (
              <FormField
                id="bank"
                as="select"
                label="Choose your bank"
                value={bank}
                disabled={paying}
                onChange={(e) => {
                  setBank(e.target.value);
                  setBankError("");
                }}
                error={bankError}
              >
                <option value="">Select a bank</option>
                {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </FormField>
            )}

            {method === "tng" && (
              <FormField
                id="tngPhone"
                label="TNG eWallet mobile number"
                type="tel"
                placeholder="012-3456789"
                autoComplete="tel"
                value={phone}
                disabled={paying}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneError("");
                }}
                error={phoneError}
              />
            )}

            {paying ? (
              <StatusMessage type="loading" title={method === "tng" ? "Waiting for approval..." : "Processing your payment..."}>
                {method === "tng" ? `Please confirm the payment of ${formatRM(booking.total)} in your TNG eWallet app.` : "Please do not close or refresh this page."}
              </StatusMessage>
            ) : (
              <p className="hold-note">Your booking is held for <strong>{mmss(remaining)}</strong>. Please complete payment before the time runs out.</p>
            )}

            <button type="submit" className="btn btn-primary" disabled={paying}>
              {paying ? "Processing..." : payLabel}
            </button>
            <button type="button" className="btn-link" onClick={handleCancel} disabled={paying}>Cancel this booking</button>
            <p className="muted small">By paying you confirm you accepted the Terms &amp; Conditions (version {booking.terms.version}). <Link to="/terms" target="_blank">Read them again</Link></p>
          </form>
        )}

        <BookingSummary
          destination={booking.destination}
          category={booking.category}
          duration={booking.duration}
          pricePerPerson={booking.pricePerPerson}
          travellers={booking.travellers}
          travelDate={booking.travelDate}
          promoCode={booking.promoCode}
          pickup={booking.pickup}
        />
      </div>
    </section>
  );
}