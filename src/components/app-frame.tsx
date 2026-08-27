"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CartProvider } from "./cart-provider";
import { Header } from "./header";

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return children;
  return (
    <CartProvider>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      {children}
      <footer className="site-footer">
        <div>
          <Link className="logo" href="/">
            Food<span>.</span>Go
          </Link>
          <p>Ingredient-led food, in motion.</p>
        </div>
        <div>
          <strong>Explore</strong>
          <Link href="/#menu">Menu</Link>
          <Link href="/track">Track order</Link>
          <Link href="/#support">Support</Link>
        </div>
        <div>
          <strong>Operations</strong>
          <Link href="/admin/login">Staff sign-in</Link>
          <span>Daily · 11:00–23:00</span>
          <span>Bengaluru, India</span>
        </div>
        <small>© {new Date().getFullYear()} Food.Go. Crafted for good evenings.</small>
      </footer>
    </CartProvider>
  );
}
