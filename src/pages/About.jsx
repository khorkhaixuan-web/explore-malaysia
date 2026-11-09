const highlights = [
  { icon: "💰", title: "Affordable travel packages", text: "Clear prices with no hidden costs, so students, families and groups can travel on a budget.." },
  { icon: "🗺️", title: "Experienced tour guides", text: "Learn more on every trip with knowledgeable local guides who make each destination come alive." },
  { icon: "🇲🇾", title: "Local destinations", text: "The best of Malaysia, from Langkawi to Sabah." },
  { icon: "🚐", title: "Comfortable travel arrangements", text: "Comfort from start to finish: air-conditioned transport, quality stays and a well-organised plan." },
];

export default function About() {
  return (
    <section className="container section">
      <h1 className="page-title">About US</h1>
      <p className="lead">
        Explore Malaysia is a locally owned travel agency offering well-planned,
        affordable tour packages across Malaysia. Whether you prefer islands, mountains,
        heritage sites, jungle or city life, we handle the details so your trip is smooth,
        comfortable and worry-free...
      </p>

      <h2 className="section-title">Our highlights</h2>
      <div className="grid-4">
        {highlights.map((h) => (
          <div className="tile" key={h.title}>
            <span className="tile-icon" aria-hidden="true">{h.icon}</span>
            <h3>{h.title}</h3>
            <p>{h.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}