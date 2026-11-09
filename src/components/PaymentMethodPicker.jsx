import { PAYMENT_METHODS } from "../payment.js";

// Radio-style list of payment methods. Props: value (method id), onChange(id), disabled
export default function PaymentMethodPicker({ value, onChange, disabled }) {
  return (
    <fieldset className="pay-options" disabled={disabled}>
      <legend>Choose a payment method</legend>
      {PAYMENT_METHODS.map((m) => (
        <label key={m.id} className={value === m.id ? "pay-option selected" : "pay-option"}>
          <input type="radio" name="payMethod" value={m.id} checked={value === m.id} onChange={() => onChange(m.id)} />
          <span className={`pay-badge pay-badge-${m.id}`} aria-hidden="true">{m.badge}</span>
          <span className="pay-option-text">
            <strong>{m.label}</strong>
            <span className="muted small">{m.hint}</span>
          </span>
          <span className="pay-selected" aria-hidden="true">{value === m.id ? "✓" : ""}</span>
        </label>
      ))}
    </fieldset>
  );
}