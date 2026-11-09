import { useEffect, useMemo, useState } from "react";
import { fetchPackages } from "../api.js";
import PackageCard from "../components/PackageCard.jsx";
import PackageFilters from "../components/PackageFilters.jsx";
import StatusMessage from "../components/StatusMessage.jsx";
import useFavorites from "../hooks/useFavorites.js";

export default function Packages() {
  // ----- data from the API, stored in state -----
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0); // changes when user clicks "Try again"

  // ----- new-feature state -----
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [showFavorites, setShowFavorites] = useState(false);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  // Fetch the packages from the API when the component loads.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPackages()
      .then((data) => {
        if (!cancelled) setPackages(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const categories = useMemo(() => [...new Set(packages.map((p) => p.category))].sort(), [packages]);

  // Apply search, category filter, favourites filter and sorting.
  const visible = useMemo(() => {
    let list = packages.filter((p) => p.destination.toLowerCase().includes(search.trim().toLowerCase()));
    if (category !== "All") list = list.filter((p) => p.category === category);
    if (showFavorites) list = list.filter((p) => favorites.includes(p.id));
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [packages, search, category, sort, showFavorites, favorites]);

  const reset = () => {
    setSearch("");
    setCategory("All");
    setSort("default");
    setShowFavorites(false);
  };

  return (
    <section className="container section">
      <h1 className="page-title">Travel Packages</h1>
      <p className="page-sub">Choose your next adventure from our latest Malaysia travel packages.</p>

      {loading && <StatusMessage type="loading" title="Loading packages...">Please wait while we fetch the latest packages.</StatusMessage>}

      {error && (
        <StatusMessage type="error" title="Sorry, we could not load the packages.">
          {error}. <button className="btn-link" onClick={() => setAttempt(attempt + 1)}>Try again</button>
        </StatusMessage>
      )}

      {!loading && !error && packages.length === 0 && (
        <StatusMessage type="info" title="No packages available right now.">Please check back soon for new travel packages.</StatusMessage>
      )}

      {!loading && !error && packages.length > 0 && (
        <>
          <PackageFilters
            search={search} onSearch={setSearch}
            category={category} onCategory={setCategory} categories={categories}
            sort={sort} onSort={setSort}
            showFavorites={showFavorites} onShowFavorites={setShowFavorites} favoriteCount={favorites.length}
            onReset={reset}
          />

          <p className="result-count" aria-live="polite">
            Showing {visible.length} of {packages.length} packages
          </p>

          {visible.length === 0 ? (
            <StatusMessage type="info" title="No packages match your search.">
              {showFavorites && favorites.length === 0 ? "You have not added any favourites yet." : "Try a different keyword or category."}
            </StatusMessage>
          ) : (
            <div className="grid-cards">
              {visible.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} isFavorite={isFavorite(pkg.id)} onToggleFavorite={toggleFavorite} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
