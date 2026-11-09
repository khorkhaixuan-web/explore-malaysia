import { useEffect, useState } from "react";
import { fetchPackages } from "../api.js";

// Loads ONE package by id from the mock API. Returns { pkg, loading, error }.
export default function usePackage(id) {
  const [state, setState] = useState({ pkg: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ pkg: null, loading: true, error: null });
    fetchPackages()
      .then((data) => !cancelled && setState({ pkg: data.find((p) => String(p.id) === String(id)) || null, loading: false, error: null }))
      .catch((err) => !cancelled && setState({ pkg: null, loading: false, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  return state;
}
