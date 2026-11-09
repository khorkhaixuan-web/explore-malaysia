import { useEffect, useState } from "react";

// Reusable banner slider. Props: slides = [{ src, alt, caption }], interval (ms)
export default function ImageSlider({ slides, interval = 4500 }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), interval);
    return () => clearInterval(timer); // clean up when unmounted / changed
  }, [paused, interval, slides.length]);

  const prev = () => setIndex((index - 1 + slides.length) % slides.length);
  const next = () => setIndex((index + 1) % slides.length);

  return (
    <div
      className="slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Popular Malaysia destinations"
    >
      {slides.map((s, i) => (
        <figure key={s.src} className={i === index ? "slide active" : "slide"} aria-hidden={i !== index}>
          <img src={s.src} alt={s.alt} />
          <figcaption>{s.caption}</figcaption>
        </figure>
      ))}

      <button className="slider-btn left" onClick={prev} aria-label="Previous slide">‹</button>
      <button className="slider-btn right" onClick={next} aria-label="Next slide">›</button>

      <div className="dots">
        {slides.map((s, i) => (
          <button
            key={s.src}
            className={i === index ? "dot active" : "dot"}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
