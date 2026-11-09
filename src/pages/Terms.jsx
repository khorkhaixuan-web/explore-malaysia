import { Link } from "react-router-dom";
import TermsContent from "../components/TermsContent.jsx";
import { TERMS_UPDATED } from "../data/terms.js";
import { TERMS_VERSION } from "../bookings.js";

export default function Terms() {
  return (
    <section className="container section narrow">
      <h1 className="page-title">Terms &amp; Conditions</h1>
      <p className="page-sub">Version {TERMS_VERSION} · Last updated {TERMS_UPDATED}</p>
      <div className="form">
        <TermsContent />
      </div>
      <p className="center" style={{ marginTop: "1.5rem" }}>
        <Link to="/packages" className="btn btn-primary">Browse packages</Link>
      </p>
    </section>
  );
}
