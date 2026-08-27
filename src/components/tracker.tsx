"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import type { OrderStatus, OrderView } from "@/lib/domain";
import { formatMoney } from "@/lib/money";

const progress: OrderStatus[] = ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
const labels: Record<OrderStatus, string> = {
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};

export function Tracker() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderView | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: form.get("orderNumber"), phone: form.get("phone") })
      });
      const data = (await response.json()) as { order?: OrderView; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error || "Order not found.");
      setOrder(data.order);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Order not found.");
    } finally {
      setLoading(false);
    }
  }
  const currentIndex = order ? progress.indexOf(order.status) : -1;
  return (
    <div className="tracker-layout">
      <form className="track-form" onSubmit={submit}>
        <span className="eyebrow">Live from our kitchen</span>
        <h1>Track your order.</h1>
        <p>Enter the order ID from confirmation and the same phone number used at checkout.</p>
        <label className="field">
          <span>Order ID</span>
          <input
            name="orderNumber"
            defaultValue={params.get("order") || ""}
            placeholder="FG-20260823-ABC123"
            required
            autoCapitalize="characters"
          />
        </label>
        <label className="field">
          <span>Phone number</span>
          <input name="phone" type="tel" required />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={loading}>
          {loading ? "Finding your order…" : "Track order"}
        </button>
      </form>
      <section className="tracking-result" aria-live="polite">
        {!order ? (
          <div className="tracking-placeholder">
            <span>FG</span>
            <p>Your kitchen timeline will appear here.</p>
          </div>
        ) : (
          <>
            <div className="tracking-head">
              <div>
                <span className="eyebrow">Order {order.orderNumber}</span>
                <h2>{labels[order.status]}</h2>
              </div>
              <strong>{formatMoney(order.totalMinor)}</strong>
            </div>
            {order.status === "CANCELLED" ? (
              <div className="cancelled-panel">
                This order was cancelled. Contact support if you need help.
              </div>
            ) : (
              <ol className="timeline">
                {progress.map((status, index) => (
                  <li className={index <= currentIndex ? "complete" : ""} key={status}>
                    <span>{index < currentIndex ? "✓" : index + 1}</span>
                    <div>
                      <strong>{labels[status]}</strong>
                      <small>
                        {order.statusEvents.find((event) => event.status === status)?.note ||
                          (index <= currentIndex ? "Complete" : "Waiting")}
                      </small>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <div className="order-summary">
              <h3>Your order</h3>
              {order.items.map((item) => (
                <div key={item.id}>
                  <span>
                    {item.quantity} × {item.nameSnapshot}
                  </span>
                  <strong>{formatMoney(item.priceMinor * item.quantity)}</strong>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
