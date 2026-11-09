// NEW FEATURES 1 & 2: search box, category filter and price sorting.
// This is a controlled, reusable component - all values come from props.
export default function PackageFilters({
  search, onSearch,
  category, onCategory, categories,
  sort, onSort,
  showFavorites, onShowFavorites, favoriteCount,
  onReset,
}) {
  return (
    <form className="filters" onSubmit={(e) => e.preventDefault()} role="search" aria-label="Filter packages">
      <div className="field">
        <label htmlFor="search">Search destination</label>
        <input id="search" type="search" placeholder="e.g. Langkawi" value={search} onChange={(e) => onSearch(e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="category">Category</label>
        <select id="category" value={category} onChange={(e) => onCategory(e.target.value)}>
          <option value="All">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="sort">Sort by price</label>
        <select id="sort" value={sort} onChange={(e) => onSort(e.target.value)}>
          <option value="default">Default</option>
          <option value="low">Low to high</option>
          <option value="high">High to low</option>
        </select>
      </div>

      <div className="filter-actions">
        <button type="button" className={showFavorites ? "btn btn-primary" : "btn btn-outline"} onClick={() => onShowFavorites(!showFavorites)} aria-pressed={showFavorites}>
          ♥ Favourites ({favoriteCount})
        </button>
        <button type="button" className="btn btn-link" onClick={onReset}>Reset</button>
      </div>
    </form>
  );
}
