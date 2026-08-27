"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type {
  ContactView,
  MenuItemView,
  OrderStatus,
  OrderView,
  ReviewStatus,
  ReviewView,
  StaffSession
} from "@/lib/domain";
import { formatMoney } from "@/lib/money";

type Summary = {
  ordersToday: number;
  activeOrders: number;
  revenueMinor: number;
  pendingReviews: number;
  openMessages: number;
};
type Tab = "orders" | "menu" | "reviews" | "messages";

export function AdminDashboard({
  initialSummary,
  initialOrders,
  initialMenu,
  initialReviews,
  initialMessages,
  staff
}: {
  initialSummary: Summary;
  initialOrders: OrderView[];
  initialMenu: MenuItemView[];
  initialReviews: ReviewView[];
  initialMessages: ContactView[];
  staff: StaffSession;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("orders");
  const [summary, setSummary] = useState(initialSummary);
  const [orders, setOrders] = useState(initialOrders);
  const [menu, setMenu] = useState(initialMenu);
  const [reviews, setReviews] = useState(initialReviews);
  const [messages, setMessages] = useState(initialMessages);
  const [editing, setEditing] = useState<MenuItemView | "new" | null>(null);
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    const [summaryResponse, ordersResponse, menuResponse, reviewsResponse, messagesResponse] =
      await Promise.all([
        fetch("/api/admin/summary"),
        fetch("/api/orders"),
        fetch("/api/menu?all=1"),
        fetch("/api/reviews?all=1"),
        fetch("/api/contact")
      ]);
    if (summaryResponse.ok)
      setSummary(((await summaryResponse.json()) as { summary: Summary }).summary);
    if (ordersResponse.ok)
      setOrders(((await ordersResponse.json()) as { orders: OrderView[] }).orders);
    if (menuResponse.ok) setMenu(((await menuResponse.json()) as { items: MenuItemView[] }).items);
    if (reviewsResponse.ok)
      setReviews(((await reviewsResponse.json()) as { reviews: ReviewView[] }).reviews);
    if (messagesResponse.ok)
      setMessages(((await messagesResponse.json()) as { messages: ContactView[] }).messages);
  }, []);

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(refreshTimer);
  }, [refresh]);
  async function changeStatus(number: string, status: OrderStatus) {
    setNotice("");
    const response = await fetch(`/api/orders/${encodeURIComponent(number)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const result = (await response.json()) as { order?: OrderView; error?: string };
    if (!response.ok || !result.order) return setNotice(result.error || "Status change failed.");
    setOrders((current) =>
      current.map((order) => (order.orderNumber === number ? result.order! : order))
    );
    setNotice(`${number} moved to ${status.replaceAll("_", " ").toLowerCase()}.`);
    await refresh();
  }
  async function saveMenu(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = editing === "new" ? null : editing?.id;
    const payload = {
      name: form.get("name"),
      slug: form.get("slug"),
      description: form.get("description"),
      priceMinor: Math.round(Number(form.get("price")) * 100),
      imageUrl: form.get("imageUrl"),
      dietaryLabels: String(form.get("dietaryLabels") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      ratingHundredths: Math.round(Number(form.get("rating")) * 100),
      prepMinutes: Number(form.get("prepMinutes")),
      featured: form.get("featured") === "on",
      active: form.get("active") === "on",
      categoryName: form.get("categoryName"),
      categorySlug: form.get("categorySlug")
    };
    const response = await fetch(id ? `/api/menu/${id}` : "/api/menu", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = (await response.json()) as { item?: MenuItemView; error?: string };
    if (!response.ok || !result.item)
      return setNotice(result.error || "Menu item could not be saved.");
    setMenu((current) =>
      id
        ? current.map((item) => (item.id === id ? result.item! : item))
        : [...current, result.item!]
    );
    setEditing(null);
    setNotice(`${result.item.name} saved.`);
  }
  async function deactivate(item: MenuItemView) {
    if (!window.confirm(`Deactivate ${item.name}? Existing order history is preserved.`)) return;
    const response = await fetch(`/api/menu/${item.id}`, { method: "DELETE" });
    if (response.ok) {
      const result = (await response.json()) as { item: MenuItemView };
      setMenu((current) => current.map((entry) => (entry.id === item.id ? result.item : entry)));
      setNotice(`${item.name} deactivated.`);
    }
  }
  async function moderate(id: string, status: ReviewStatus) {
    const response = await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (response.ok) {
      const result = (await response.json()) as { review: ReviewView };
      setReviews((current) => current.map((review) => (review.id === id ? result.review : review)));
      setNotice(`Review marked ${status.toLowerCase()}.`);
      await refresh();
    }
  }
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="logo" href="/">
          Food<span>.</span>Go
        </Link>
        <div className="staff-card">
          <span>{staff.name}</span>
          <small>{staff.role.toLowerCase()}</small>
        </div>
        <nav>
          {(["orders", "menu", "reviews", "messages"] as Tab[]).map((name) => (
            <button
              key={name}
              className={tab === name ? "active" : ""}
              onClick={() => setTab(name)}
            >
              {name}
              <span>
                {name === "orders"
                  ? summary.activeOrders
                  : name === "reviews"
                    ? summary.pendingReviews
                    : name === "messages"
                      ? summary.openMessages
                      : menu.length}
              </span>
            </button>
          ))}
        </nav>
        <button className="text-button logout" onClick={logout}>
          Sign out
        </button>
      </aside>
      <section className="admin-main">
        <div className="admin-title">
          <div>
            <span className="eyebrow">Live operations</span>
            <h1>Good evening, {staff.name.split(" ")[0]}.</h1>
          </div>
          <button className="button secondary" onClick={refresh}>
            Refresh
          </button>
        </div>
        <div className="metric-grid">
          <Metric label="Orders today" value={String(summary.ordersToday)} />
          <Metric label="Active now" value={String(summary.activeOrders)} />
          <Metric label="Revenue today" value={formatMoney(summary.revenueMinor)} />
          <Metric
            label="Needs attention"
            value={String(summary.pendingReviews + summary.openMessages)}
          />
        </div>
        {notice && (
          <p className="admin-notice" role="status">
            {notice}
          </p>
        )}
        {tab === "orders" && (
          <section className="admin-panel">
            <div className="panel-head">
              <h2>Recent orders</h2>
              <span>{orders.length} total</span>
            </div>
            {orders.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.orderNumber}</strong>
                          <small>{order.phone}</small>
                        </td>
                        <td>
                          {order.customerName}
                          <small>{order.deliveryAddress}</small>
                        </td>
                        <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                        <td>{formatMoney(order.totalMinor)}</td>
                        <td>
                          <select
                            aria-label={`Status for ${order.orderNumber}`}
                            value={order.status}
                            onChange={(event) =>
                              changeStatus(order.orderNumber, event.target.value as OrderStatus)
                            }
                          >
                            {statusOptions(order.status).map((status) => (
                              <option key={status} value={status}>
                                {status.replaceAll("_", " ")}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty text="New orders will appear here immediately." />
            )}
          </section>
        )}
        {tab === "menu" && (
          <section className="admin-panel">
            <div className="panel-head">
              <h2>Menu catalogue</h2>
              <button className="button primary small" onClick={() => setEditing("new")}>
                Add menu item
              </button>
            </div>
            {editing && (
              <MenuForm
                item={editing === "new" ? null : editing}
                onSubmit={saveMenu}
                onCancel={() => setEditing(null)}
              />
            )}
            {menu.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Dish</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Flags</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menu.map((item) => (
                      <tr key={item.id} className={!item.active ? "muted-row" : ""}>
                        <td>
                          <strong>{item.name}</strong>
                          <small>{item.slug}</small>
                        </td>
                        <td>{item.category.name}</td>
                        <td>{formatMoney(item.priceMinor)}</td>
                        <td>
                          {item.featured ? "Featured" : "Standard"} ·{" "}
                          {item.active ? "Active" : "Inactive"}
                        </td>
                        <td>
                          <div className="row-actions">
                            <button className="text-button" onClick={() => setEditing(item)}>
                              Edit
                            </button>
                            {item.active && (
                              <button
                                className="text-button danger"
                                onClick={() => deactivate(item)}
                              >
                                Deactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty text="No menu items yet." />
            )}
          </section>
        )}
        {tab === "reviews" && (
          <section className="admin-panel">
            <div className="panel-head">
              <h2>Review moderation</h2>
              <span>{summary.pendingReviews} pending</span>
            </div>
            {reviews.length ? (
              <div className="review-admin-grid">
                {reviews.map((review) => (
                  <article key={review.id}>
                    <div>
                      <strong>{review.authorName}</strong>
                      <span>{"★".repeat(review.rating)}</span>
                    </div>
                    <p>{review.body}</p>
                    <small>{review.status}</small>
                    <div className="row-actions">
                      <button
                        className="text-button"
                        onClick={() => moderate(review.id, "APPROVED")}
                      >
                        Approve
                      </button>
                      <button
                        className="text-button danger"
                        onClick={() => moderate(review.id, "REJECTED")}
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty text="No reviews to moderate." />
            )}
          </section>
        )}
        {tab === "messages" && (
          <section className="admin-panel">
            <div className="panel-head">
              <h2>Support inbox</h2>
              <span>{messages.length} messages</span>
            </div>
            {messages.length ? (
              <div className="message-list">
                {messages.map((message) => (
                  <article key={message.id}>
                    <div>
                      <strong>{message.subject}</strong>
                      <span>{new Date(message.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                    <p>{message.message}</p>
                    <small>
                      {message.name} · <a href={`mailto:${message.email}`}>{message.email}</a>
                      {message.phone ? ` · ${message.phone}` : ""}
                    </small>
                  </article>
                ))}
              </div>
            ) : (
              <Empty text="Support messages will appear here." />
            )}
          </section>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <p>{text}</p>
    </div>
  );
}
function statusOptions(current: OrderStatus): OrderStatus[] {
  const map: Record<OrderStatus, OrderStatus[]> = {
    CONFIRMED: ["CONFIRMED", "PREPARING", "CANCELLED"],
    PREPARING: ["PREPARING", "OUT_FOR_DELIVERY", "CANCELLED"],
    OUT_FOR_DELIVERY: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
    DELIVERED: ["DELIVERED"],
    CANCELLED: ["CANCELLED"]
  };
  return map[current];
}

function MenuForm({
  item,
  onSubmit,
  onCancel
}: {
  item: MenuItemView | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form className="menu-admin-form" onSubmit={onSubmit}>
      <h3>{item ? `Edit ${item.name}` : "Create menu item"}</h3>
      <div className="field-grid">
        <label className="field">
          <span>Name</span>
          <input name="name" defaultValue={item?.name} required />
        </label>
        <label className="field">
          <span>Slug</span>
          <input name="slug" defaultValue={item?.slug} pattern="[a-z0-9-]+" required />
        </label>
      </div>
      <label className="field">
        <span>Description</span>
        <textarea name="description" defaultValue={item?.description} required rows={3} />
      </label>
      <div className="field-grid">
        <label className="field">
          <span>Price (₹)</span>
          <input
            name="price"
            type="number"
            min="1"
            step="0.01"
            defaultValue={item ? item.priceMinor / 100 : 299}
            required
          />
        </label>
        <label className="field">
          <span>Prep minutes</span>
          <input
            name="prepMinutes"
            type="number"
            min="1"
            defaultValue={item?.prepMinutes || 20}
            required
          />
        </label>
      </div>
      <div className="field-grid">
        <label className="field">
          <span>Category</span>
          <input name="categoryName" defaultValue={item?.category.name || "Mains"} required />
        </label>
        <label className="field">
          <span>Category slug</span>
          <input name="categorySlug" defaultValue={item?.category.slug || "mains"} required />
        </label>
      </div>
      <label className="field">
        <span>Image path</span>
        <input name="imageUrl" defaultValue={item?.imageUrl || "/images/menu1.jpg"} required />
      </label>
      <div className="field-grid">
        <label className="field">
          <span>Dietary labels (comma-separated)</span>
          <input
            name="dietaryLabels"
            defaultValue={item?.dietaryLabels.join(", ") || "Vegetarian"}
          />
        </label>
        <label className="field">
          <span>Rating</span>
          <input
            name="rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            defaultValue={item ? item.ratingHundredths / 100 : 4.5}
          />
        </label>
      </div>
      <div className="check-row">
        <label>
          <input type="checkbox" name="featured" defaultChecked={item?.featured} /> Featured
        </label>
        <label>
          <input type="checkbox" name="active" defaultChecked={item?.active ?? true} /> Active
        </label>
      </div>
      <div className="row-actions">
        <button className="button primary small">Save item</button>
        <button className="button secondary small" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
