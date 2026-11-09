import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>© {new Date().getFullYear()} Explore Malaysia. Discover Malaysia, Create Memories.</p>
        <p><Link to="/terms">Terms &amp; Conditions</Link></p>
      </div>
    </footer>
  );
}
