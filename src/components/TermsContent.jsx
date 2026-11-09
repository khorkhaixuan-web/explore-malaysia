import { TERMS } from "../data/terms.js";

// The Terms & Conditions text. Used on the /terms page and inside the booking form.
export default function TermsContent() {
  return (
    <div className="terms">
      {TERMS.map((section) => (
        <section key={section.title}>
          <h3>{section.title}</h3>
          <ul>
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
