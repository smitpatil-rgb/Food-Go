"use client";

import { useMemo, useRef, useState } from "react";
import type { MenuItemView } from "@/lib/domain";
import { formatMoney } from "@/lib/money";
import { useCart } from "./cart-provider";

export function MenuBrowser({ items }: { items: MenuItemView[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<MenuItemView | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { add } = useCart();
  const categories = useMemo(() => [...new Set(items.map((item) => item.category.slug))], [items]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = category === "all" || item.category.slug === category;
      const matchesSearch =
        !query ||
        `${item.name} ${item.description} ${item.dietaryLabels.join(" ")}`
          .toLowerCase()
          .includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, items, search]);

  function showDetails(item: MenuItemView) {
    setSelected(item);
    requestAnimationFrame(() => dialogRef.current?.showModal());
  }

  return (
    <>
      <div className="menu-tools">
        <label className="search-field">
          <span className="sr-only">Search menu</span>
          <input
            type="search"
            placeholder="Search flavour, dish, dietary label…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="filters" aria-label="Filter menu by category">
          <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>
            All
          </button>
          {categories.map((slug) => (
            <button
              key={slug}
              className={category === slug ? "active" : ""}
              onClick={() => setCategory(slug)}
            >
              {items.find((item) => item.category.slug === slug)?.category.name}
            </button>
          ))}
        </div>
      </div>
      {filtered.length ? (
        <div className="menu-grid">
          {filtered.map((item, index) => (
            <article
              className={`menu-card ${index === 0 ? "menu-card-featured" : ""}`}
              key={item.id}
            >
              <button
                className="card-image"
                onClick={() => showDetails(item)}
                aria-label={`View details for ${item.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt={item.name} />
                {item.featured && <span className="featured-chip">Chef&apos;s signal</span>}
              </button>
              <div className="card-body">
                <div className="card-meta">
                  <span>{item.category.name}</span>
                  <span>★ {(item.ratingHundredths / 100).toFixed(1)}</span>
                  <span>{item.prepMinutes} min</span>
                </div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="labels">
                  {item.dietaryLabels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
                <div className="card-actions">
                  <strong>{formatMoney(item.priceMinor)}</strong>
                  <button className="button primary small" onClick={() => add(item)}>
                    Add to cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No dishes match that search. Try another flavour.</p>
        </div>
      )}
      <dialog
        ref={dialogRef}
        className="product-dialog"
        onClose={() => setSelected(null)}
        aria-labelledby="product-title"
      >
        {selected && (
          <div className="product-detail">
            <button
              className="icon-button dialog-close"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close product details"
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.imageUrl} alt={selected.name} />
            <div>
              <span className="eyebrow">{selected.category.name}</span>
              <h2 id="product-title">{selected.name}</h2>
              <p>{selected.description}</p>
              <div className="product-facts">
                <span>★ {(selected.ratingHundredths / 100).toFixed(1)}</span>
                <span>{selected.prepMinutes} minutes</span>
              </div>
              <div className="labels">
                {selected.dietaryLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="card-actions">
                <strong>{formatMoney(selected.priceMinor)}</strong>
                <button
                  className="button primary"
                  onClick={() => {
                    add(selected);
                    dialogRef.current?.close();
                  }}
                >
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
