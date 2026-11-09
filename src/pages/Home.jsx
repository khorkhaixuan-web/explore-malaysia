import { Link } from "react-router-dom";
import ImageSlider from "../components/ImageSlider.jsx";

const slides = [
  { src: "/images/beach.png", alt: "Illustration of a tropical beach with palm trees and blue sea", caption: "Beautiful beaches and sunsets in Langkawi" },
  { src: "/images/nature.png", alt: "Illustration of mountains, pine trees and a winding river at sunset", caption: "Cool highlands of Cameron Highlands" },
  { src: "/images/heritage.png", alt: "Illustration of a street of colourful heritage shophouses", caption: "Heritage towns of Penang, Melaka & Ipoh - street art & food" },
  { src: "/images/adventure.png", alt: "Illustration of a green forest with tall trees and a calm river", caption: "Into the green: Sabah & Sarawak rainforests" },
  { src: "/images/city.png", alt: "Illustration of the Kuala Lumpur skyline with the Petronas Twin Towers at sunset", caption: "City lights in Kuala Lumpur" },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <ImageSlider slides={slides} />
        <div className="hero-text">
          <p className="eyebrow">Welcome to</p>
          <h1>Explore Malaysia</h1>
          <p className="tagline">Discover Malaysia, Create Memories.</p>
          <div className="hero-actions">
            <Link to="/packages" className="btn btn-primary">Browse Packages</Link>
            <Link to="/contact" className="btn btn-light">Contact Us</Link>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2 className="section-title">Why travel with us?</h2>
        <div className="grid-3">
          <div className="tile"><span className="tile-icon" aria-hidden="true">🏝️</span><h3>Local destinations</h3><p>From island beaches to highland retreats, all across Malaysia.</p></div>
          <div className="tile"><span className="tile-icon" aria-hidden="true">💰</span><h3>Affordable packages</h3><p>Clear prices with no hidden charges, for every budget.</p></div>
          <div className="tile"><span className="tile-icon" aria-hidden="true">🧭</span><h3>Experienced guides</h3><p>Friendly local guides who know the best spots and stories.</p></div>
        </div>
      </section>
    </>
  );
}