"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./cart-provider";

export function Header() {
  const [open, setOpen] = useState(false);
  const { count, open: openCart } = useCart();
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header className="site-header">
      <Link className="logo" href="/" aria-label="Food.Go home">
        Food<span>.</span>Go
      </Link>
      <button
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="site-nav"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sr-only">Toggle navigation</span>
        <span />
        <span />
      </button>
      <nav id="site-nav" className={open ? "nav open" : "nav"} aria-label="Primary">
        <Link href="/#menu" onClick={() => setOpen(false)}>
          Menu
        </Link>
        <Link href="/#story" onClick={() => setOpen(false)}>
          Our kitchen
        </Link>
        <Link href="/track" onClick={() => setOpen(false)}>
          Track order
        </Link>
        <Link href="/#support" onClick={() => setOpen(false)}>
          Support
        </Link>
      </nav>
      <button className="cart-button" onClick={openCart}>
        Cart <span>{count}</span>
      </button>
    </header>
  );
}
