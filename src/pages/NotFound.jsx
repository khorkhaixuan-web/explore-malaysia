import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="container section narrow center">
      <h1 className="page-title">Page not found</h1>
      <p className="page-sub">The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </section>
  );
}
