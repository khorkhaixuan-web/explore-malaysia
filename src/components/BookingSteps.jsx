const STEPS = ["Trip details", "Payment", "Confirmation"];

// Progress indicator. Props: current (1, 2 or 3)
export default function BookingSteps({ current }) {
  return (
    <ol className="steps" aria-label="Booking progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "current" : "todo";
        return (
          <li key={label} className={`step step-${state}`} aria-current={state === "current" ? "step" : undefined}>
            <span className="step-num">{state === "done" ? "✓" : n}</span>
            <span className="step-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
