"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { FormEvent, ReactNode } from "react";
import type { MenuItemView, OrderView } from "@/lib/domain";
import { formatMoney } from "@/lib/money";

type CartLine = { item: MenuItemView; quantity: number };
type CartContextValue = {
  lines: CartLine[];
  count: number;
  add: (item: MenuItemView) => void;
  change: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  open: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "foodgo-cart-v3";

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) queueMicrotask(() => setLines(JSON.parse(saved) as CartLine[]));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    queueMicrotask(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [hydrated, lines]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.foodgoReady = "true";
    return () => {
      delete document.documentElement.dataset.foodgoReady;
    };
  }, [hydrated]);

  const add = useCallback((item: MenuItemView) => {
    setLines((current) => {
      const found = current.find((line) => line.item.id === item.id);
      if (found)
        return current.map((line) =>
          line.item.id === item.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      return [...current, { item, quantity: 1 }];
    });
    setDrawerOpen(true);
  }, []);

  const change = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) setLines((current) => current.filter((line) => line.item.id !== id));
    else
      setLines((current) =>
        current.map((line) => (line.item.id === id ? { ...line, quantity } : line))
      );
  }, []);
  const remove = useCallback(
    (id: string) => setLines((current) => current.filter((line) => line.item.id !== id)),
    []
  );
  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      add,
      change,
      remove,
      open: () => setDrawerOpen(true)
    }),
    [add, change, lines, remove]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        lines={lines}
        change={change}
        remove={remove}
        clear={() => setLines([])}
      />
    </CartContext.Provider>
  );
}

function CartDrawer({
  open,
  onClose,
  lines,
  change,
  remove,
  clear
}: {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  change: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [order, setOrder] = useState<OrderView | null>(null);
  const idempotency = useRef<string>("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const subtotal = lines.reduce((sum, line) => sum + line.item.priceMinor * line.quantity, 0);
  const delivery = subtotal >= 100000 ? 0 : 4900;
  const tax = Math.round(subtotal * 0.05);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lines.length || submitting) return;
    setSubmitting(true);
    setError("");
    setFieldErrors({});
    if (!idempotency.current) idempotency.current = crypto.randomUUID();
    const form = new FormData(event.currentTarget);
    const payload = {
      customerName: form.get("customerName"),
      phone: form.get("phone"),
      email: form.get("email"),
      deliveryAddress: form.get("deliveryAddress"),
      notes: form.get("notes"),
      paymentMethod: form.get("paymentMethod"),
      idempotencyKey: idempotency.current,
      items: lines.map((line) => ({ menuItemId: line.item.id, quantity: line.quantity }))
    };
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as {
        order?: OrderView;
        error?: string;
        fieldErrors?: Record<string, string[]>;
      };
      if (!response.ok || !data.order) {
        setError(data.error || "Order could not be placed.");
        setFieldErrors(data.fieldErrors || {});
        return;
      }
      setOrder(data.order);
      clear();
      idempotency.current = "";
    } catch {
      setError("We could not reach the kitchen. Your cart is still saved.");
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    onClose();
    if (order) setOrder(null);
  }

  return (
    <dialog
      ref={dialogRef}
      className="cart-dialog"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={onClose}
      aria-labelledby="cart-title"
    >
      <div className="drawer-head">
        <div>
          <span className="eyebrow">Your order</span>
          <h2 id="cart-title">{order ? "Kitchen confirmed." : "Cart & checkout"}</h2>
        </div>
        <button className="icon-button" onClick={close} aria-label="Close cart">
          ×
        </button>
      </div>
      {order ? (
        <div className="success-panel" role="status">
          <span className="success-mark">✓</span>
          <p>Your durable order ID</p>
          <strong>{order.orderNumber}</strong>
          <p>
            Keep this ID. You will also need <strong>{order.phone}</strong> to track delivery.
          </p>
          <Link
            className="button primary"
            href={`/track?order=${encodeURIComponent(order.orderNumber)}`}
            onClick={close}
          >
            Track this order
          </Link>
        </div>
      ) : lines.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is ready for something excellent.</p>
          <button className="button primary" onClick={close}>
            Explore the menu
          </button>
        </div>
      ) : (
        <>
          <div className="cart-lines">
            {lines.map(({ item, quantity }) => (
              <article className="cart-line" key={item.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt="" />
                <div>
                  <h3>{item.name}</h3>
                  <span>{formatMoney(item.priceMinor)}</span>
                </div>
                <div className="quantity" aria-label={`Quantity for ${item.name}`}>
                  <button
                    onClick={() => change(item.id, quantity - 1)}
                    aria-label={`Decrease ${item.name}`}
                  >
                    −
                  </button>
                  <span aria-live="polite">{quantity}</span>
                  <button
                    onClick={() => change(item.id, quantity + 1)}
                    aria-label={`Increase ${item.name}`}
                  >
                    +
                  </button>
                </div>
                <button className="text-button" onClick={() => remove(item.id)}>
                  Remove
                </button>
              </article>
            ))}
          </div>
          <div className="totals" aria-label="Estimated order totals">
            <div>
              <span>Subtotal</span>
              <strong>{formatMoney(subtotal)}</strong>
            </div>
            <div>
              <span>Delivery</span>
              <strong>{delivery ? formatMoney(delivery) : "Free"}</strong>
            </div>
            <div>
              <span>Tax</span>
              <strong>{formatMoney(tax)}</strong>
            </div>
            <div className="total">
              <span>Estimated total</span>
              <strong>{formatMoney(subtotal + delivery + tax)}</strong>
            </div>
            <small>Final totals are recalculated securely by the server.</small>
          </div>
          <form className="checkout-form" onSubmit={submit} noValidate>
            <div className="field-grid">
              <Field
                label="Name"
                name="customerName"
                autoComplete="name"
                error={fieldErrors.customerName?.[0]}
                required
              />
              <Field
                label="Phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                error={fieldErrors.phone?.[0]}
                required
              />
            </div>
            <Field
              label="Email (optional)"
              name="email"
              type="email"
              autoComplete="email"
              error={fieldErrors.email?.[0]}
            />
            <label className="field">
              <span>Delivery address</span>
              <textarea
                name="deliveryAddress"
                autoComplete="street-address"
                rows={3}
                required
                aria-invalid={Boolean(fieldErrors.deliveryAddress)}
              />
              {fieldErrors.deliveryAddress?.[0] && (
                <small className="field-error">{fieldErrors.deliveryAddress[0]}</small>
              )}
            </label>
            <Field label="Order notes (optional)" name="notes" error={fieldErrors.notes?.[0]} />
            <fieldset className="payment">
              <legend>Payment on delivery</legend>
              <label>
                <input type="radio" name="paymentMethod" value="COD" defaultChecked /> Cash on
                delivery
              </label>
              <label>
                <input type="radio" name="paymentMethod" value="UPI_ON_DELIVERY" /> UPI on delivery
              </label>
            </fieldset>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary full" disabled={submitting}>
              {submitting ? "Sending to kitchen…" : "Confirm order"}
            </button>
          </form>
        </>
      )}
    </dialog>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
  ...props
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} type={type} aria-invalid={Boolean(error)} {...props} />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
