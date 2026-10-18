export function CitySearch({ id }: { id: string }) {
  const listId = id + "-list";
  return (
    <div className="search-pop" data-city-search>
      <label className="sr-only" htmlFor={id}>
        Search cities
      </label>
      <input
        id={id}
        type="search"
        placeholder="Search cities"
        autoComplete="off"
        aria-controls={listId}
      />
      <ul id={listId} hidden />
      <p className="sr-only" aria-live="polite" data-city-status />
    </div>
  );
}
