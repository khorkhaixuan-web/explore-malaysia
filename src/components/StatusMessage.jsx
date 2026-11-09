// Reusable message box for loading, error and "no data" states. Props: type, title, children
export default function StatusMessage({ type = "info", title, children }) {
  return (
    <div className={`status status-${type}`} role={type === "error" ? "alert" : "status"}>
      {type === "loading" && <span className="spinner" aria-hidden="true" />}
      <div>
        {title && <strong>{title}</strong>}
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}
