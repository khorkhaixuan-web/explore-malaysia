import FormField from "./FormField.jsx";
import { cvvLength, detectCardBrand, formatCardNumber, formatExpiry, onlyDigits } from "../payment.js";

// Credit / debit card fields. The parent owns the state (useState) and the validation.
// Props: card { cardType, name, number, expiry, cvv }, errors, onChange(patch), disabled
export default function CardForm({ card, errors, onChange, disabled }) {
  const brand = detectCardBrand(card.number);
  return (
    <div className="card-form">
      <div className="seg" role="radiogroup" aria-label="Card type">
        {[["credit", "Credit card"], ["debit", "Debit card"]].map(([id, label]) => (
          <label key={id} className={card.cardType === id ? "seg-item selected" : "seg-item"}>
            <input type="radio" name="cardType" value={id} checked={card.cardType === id} disabled={disabled} onChange={() => onChange({ cardType: id })} />
            {label}
          </label>
        ))}
      </div>

      <FormField
        id="cardName"
        label="Name on card"
        placeholder="AHMAD BIN ALI"
        autoComplete="cc-name"
        value={card.name}
        disabled={disabled}
        onChange={(e) => onChange({ name: e.target.value })}
        error={errors.name}
      />

      <div className="card-number-wrap">
        <FormField
          id="cardNumber"
          label="Card number"
          inputMode="numeric"
          placeholder="1234 5678 9012 3456"
          autoComplete="cc-number"
          value={card.number}
          disabled={disabled}
          onChange={(e) => onChange({ number: formatCardNumber(e.target.value) })}
          error={errors.number}
        />
        {brand && <span className="brand-tag" aria-live="polite">{brand}</span>}
      </div>

      <div className="form-row">
        <FormField
          id="cardExpiry"
          label="Expiry (MM/YY)"
          inputMode="numeric"
          placeholder="MM/YY"
          autoComplete="cc-exp"
          value={card.expiry}
          disabled={disabled}
          onChange={(e) => onChange({ expiry: formatExpiry(e.target.value) })}
          error={errors.expiry}
        />
        <FormField
          id="cardCvv"
          label="CVV"
          type="password"
          inputMode="numeric"
          placeholder={"•".repeat(cvvLength(brand))}
          autoComplete="cc-csc"
          value={card.cvv}
          disabled={disabled}
          onChange={(e) => onChange({ cvv: onlyDigits(e.target.value).slice(0, 4) })}
          error={errors.cvv}
        />
      </div>

      <p className="muted small">🔒 Your card number and CVV are only used for this payment and are never saved. Only the last 4 digits appear on your receipt.</p>
    </div>
  );
}