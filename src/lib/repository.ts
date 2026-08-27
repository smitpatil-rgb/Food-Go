import { randomUUID } from "node:crypto";
import { compare } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import type {
  ContactView,
  MenuItemView,
  OrderStatus,
  OrderView,
  ReviewStatus,
  ReviewView,
  StaffSession
} from "./domain";
import { memoryStore } from "./memory-store";
import { calculateTotals } from "./money";
import type { contactSchema, menuItemSchema, orderSchema, reviewSchema } from "./validation";
import type { z } from "zod";

type OrderInput = z.infer<typeof orderSchema>;
type MenuInput = z.infer<typeof menuItemSchema>;
type ReviewInput = z.infer<typeof reviewSchema>;
type ContactInput = z.infer<typeof contactSchema>;

const memoryModeEnabled = () =>
  process.env.FOODGO_DATA_MODE === "memory" || process.env.NODE_ENV === "test";

const iso = (value: Date | string) => (value instanceof Date ? value.toISOString() : value);

type DbMenu = Omit<MenuItemView, "category"> & { category: { name: string; slug: string } };
type DbOrder = Omit<OrderView, "createdAt" | "statusEvents"> & {
  createdAt: Date | string;
  statusEvents: Array<{
    id: string;
    status: OrderStatus;
    note: string | null;
    createdAt: Date | string;
  }>;
};
type DbReview = Omit<ReviewView, "createdAt"> & { createdAt: Date | string };
type DbContact = Omit<ContactView, "createdAt"> & { createdAt: Date | string };

const mapMenu = (item: DbMenu): MenuItemView => ({ ...item });
const mapOrder = (order: DbOrder): OrderView => ({
  ...order,
  createdAt: iso(order.createdAt),
  statusEvents: order.statusEvents.map((event) => ({ ...event, createdAt: iso(event.createdAt) }))
});
const mapReview = (review: DbReview): ReviewView => ({
  ...review,
  createdAt: iso(review.createdAt)
});
const mapContact = (message: DbContact): ContactView => ({
  ...message,
  createdAt: iso(message.createdAt)
});

export async function listMenu(includeInactive = false): Promise<MenuItemView[]> {
  if (memoryModeEnabled()) return memoryStore.menu.filter((item) => includeInactive || item.active);
  const items = await prisma.menuItem.findMany({
    where: includeInactive ? undefined : { active: true },
    include: { category: { select: { name: true, slug: true } } },
    orderBy: [{ featured: "desc" }, { name: "asc" }]
  });
  return items.map((item) => mapMenu(item));
}

function orderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `FG-${date}-${randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}

export async function createOrder(input: OrderInput): Promise<OrderView> {
  if (memoryModeEnabled()) {
    const existingNumber = memoryStore.idempotency.get(input.idempotencyKey);
    if (existingNumber)
      return memoryStore.orders.find((order) => order.orderNumber === existingNumber)!;
    const menuItems = memoryStore.menu.filter(
      (item) => item.active && input.items.some((entry) => entry.menuItemId === item.id)
    );
    if (menuItems.length !== new Set(input.items.map((item) => item.menuItemId)).size) {
      throw new Error("One or more menu items are unavailable");
    }
    const pricedItems = input.items.map((entry) => {
      const menu = menuItems.find((item) => item.id === entry.menuItemId)!;
      return { menu, quantity: entry.quantity, priceMinor: menu.priceMinor };
    });
    const totals = calculateTotals(pricedItems);
    const now = new Date().toISOString();
    const created: OrderView = {
      id: randomUUID(),
      orderNumber: orderNumber(),
      customerName: input.customerName,
      phone: input.phone,
      email: input.email || null,
      deliveryAddress: input.deliveryAddress,
      notes: input.notes || null,
      paymentMethod: input.paymentMethod,
      status: "CONFIRMED",
      ...totals,
      createdAt: now,
      items: pricedItems.map(({ menu, quantity }) => ({
        id: randomUUID(),
        menuItemId: menu.id,
        nameSnapshot: menu.name,
        priceMinor: menu.priceMinor,
        quantity
      })),
      statusEvents: [
        { id: randomUUID(), status: "CONFIRMED", note: "Order received", createdAt: now }
      ]
    };
    memoryStore.orders.unshift(created);
    memoryStore.idempotency.set(input.idempotencyKey, created.orderNumber);
    return created;
  }

  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { items: true, statusEvents: { orderBy: { createdAt: "asc" } } }
  });
  if (existing) return mapOrder(existing);

  const settings = await prisma.restaurantSettings.upsert({
    where: { id: "primary" },
    update: {},
    create: { id: "primary" }
  });
  const requestedIds = [...new Set(input.items.map((item) => item.menuItemId))];
  const available = await prisma.menuItem.findMany({
    where: { id: { in: requestedIds }, active: true }
  });
  if (available.length !== requestedIds.length)
    throw new Error("One or more menu items are unavailable");
  const pricedItems = input.items.map((entry) => {
    const menu = available.find((item) => item.id === entry.menuItemId)!;
    return { menu, quantity: entry.quantity, priceMinor: menu.priceMinor };
  });
  const totals = calculateTotals(pricedItems, settings.deliveryFeeMinor, settings.taxBasisPoints);
  try {
    const created = await prisma.order.create({
      data: {
        orderNumber: orderNumber(),
        customerName: input.customerName,
        phone: input.phone,
        email: input.email || null,
        deliveryAddress: input.deliveryAddress,
        notes: input.notes || null,
        paymentMethod: input.paymentMethod,
        idempotencyKey: input.idempotencyKey,
        ...totals,
        items: {
          create: pricedItems.map(({ menu, quantity }) => ({
            menuItemId: menu.id,
            nameSnapshot: menu.name,
            priceMinor: menu.priceMinor,
            quantity
          }))
        },
        statusEvents: { create: { status: "CONFIRMED", note: "Order received" } }
      },
      include: { items: true, statusEvents: { orderBy: { createdAt: "asc" } } }
    });
    return mapOrder(created);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await prisma.order.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: { items: true, statusEvents: { orderBy: { createdAt: "asc" } } }
      });
      if (raced) return mapOrder(raced);
    }
    throw error;
  }
}

export async function trackOrder(
  orderNumberValue: string,
  phone: string
): Promise<OrderView | null> {
  if (memoryModeEnabled()) {
    return (
      memoryStore.orders.find(
        (order) =>
          order.orderNumber === orderNumberValue &&
          order.phone.replace(/\D/g, "") === phone.replace(/\D/g, "")
      ) ?? null
    );
  }
  const order = await prisma.order.findFirst({
    where: { orderNumber: orderNumberValue, phone },
    include: { items: true, statusEvents: { orderBy: { createdAt: "asc" } } }
  });
  return order ? mapOrder(order) : null;
}

export async function listOrders(): Promise<OrderView[]> {
  if (memoryModeEnabled()) return memoryStore.orders;
  const orders = await prisma.order.findMany({
    include: { items: true, statusEvents: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return orders.map((order) => mapOrder(order));
}

const transitions: Record<OrderStatus, OrderStatus[]> = {
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: []
};

export async function updateOrderStatus(number: string, status: OrderStatus, note?: string) {
  if (memoryModeEnabled()) {
    const order = memoryStore.orders.find((entry) => entry.orderNumber === number);
    if (!order) return null;
    if (order.status !== status && !transitions[order.status].includes(status))
      throw new Error("Invalid status transition");
    if (order.status !== status) {
      order.status = status;
      order.statusEvents.push({
        id: randomUUID(),
        status,
        note: note || null,
        createdAt: new Date().toISOString()
      });
    }
    return order;
  }
  return prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { orderNumber: number } });
    if (!current) return null;
    if (current.status !== status && !transitions[current.status].includes(status)) {
      throw new Error("Invalid status transition");
    }
    if (current.status !== status) {
      await tx.order.update({ where: { id: current.id }, data: { status } });
      await tx.orderStatusEvent.create({ data: { orderId: current.id, status, note } });
    }
    const updated = await tx.order.findUnique({
      where: { id: current.id },
      include: { items: true, statusEvents: { orderBy: { createdAt: "asc" } } }
    });
    return updated ? mapOrder(updated) : null;
  });
}

export async function saveMenuItem(input: MenuInput, id?: string): Promise<MenuItemView> {
  if (memoryModeEnabled()) {
    const item: MenuItemView = {
      id: id ?? randomUUID(),
      name: input.name,
      slug: input.slug,
      description: input.description,
      priceMinor: input.priceMinor,
      imageUrl: input.imageUrl,
      dietaryLabels: input.dietaryLabels,
      ratingHundredths: input.ratingHundredths,
      prepMinutes: input.prepMinutes,
      featured: input.featured,
      active: input.active,
      category: { name: input.categoryName, slug: input.categorySlug }
    };
    const index = id ? memoryStore.menu.findIndex((entry) => entry.id === id) : -1;
    if (index >= 0) memoryStore.menu[index] = item;
    else memoryStore.menu.push(item);
    return item;
  }
  const data = {
    name: input.name,
    slug: input.slug,
    description: input.description,
    priceMinor: input.priceMinor,
    imageUrl: input.imageUrl,
    dietaryLabels: input.dietaryLabels,
    ratingHundredths: input.ratingHundredths,
    prepMinutes: input.prepMinutes,
    featured: input.featured,
    active: input.active,
    category: {
      connectOrCreate: {
        where: { slug: input.categorySlug },
        create: { name: input.categoryName, slug: input.categorySlug }
      }
    }
  };
  const item = id
    ? await prisma.menuItem.update({ where: { id }, data, include: { category: true } })
    : await prisma.menuItem.create({ data, include: { category: true } });
  return mapMenu(item);
}

export async function deactivateMenuItem(id: string) {
  if (memoryModeEnabled()) {
    const item = memoryStore.menu.find((entry) => entry.id === id);
    if (!item) return null;
    item.active = false;
    return item;
  }
  const item = await prisma.menuItem.update({
    where: { id },
    data: { active: false },
    include: { category: true }
  });
  return mapMenu(item);
}

export async function listReviews(all = false): Promise<ReviewView[]> {
  if (memoryModeEnabled())
    return memoryStore.reviews.filter((review) => all || review.status === "APPROVED");
  const reviews = await prisma.review.findMany({
    where: all ? undefined : { status: "APPROVED" },
    orderBy: { createdAt: "desc" }
  });
  return reviews.map((review) => mapReview(review));
}

export async function createReview(input: ReviewInput): Promise<ReviewView> {
  if (memoryModeEnabled()) {
    const review: ReviewView = {
      id: randomUUID(),
      authorName: input.authorName,
      rating: input.rating,
      body: input.body,
      status: "PENDING",
      menuItemId: input.menuItemId || null,
      createdAt: new Date().toISOString()
    };
    memoryStore.reviews.unshift(review);
    return review;
  }
  const review = await prisma.review.create({
    data: { ...input, menuItemId: input.menuItemId || null }
  });
  return mapReview(review);
}

export async function moderateReview(id: string, status: ReviewStatus) {
  if (memoryModeEnabled()) {
    const review = memoryStore.reviews.find((entry) => entry.id === id);
    if (!review) return null;
    review.status = status;
    return review;
  }
  const review = await prisma.review.update({ where: { id }, data: { status } });
  return mapReview(review);
}

export async function createContact(input: ContactInput): Promise<ContactView> {
  if (memoryModeEnabled()) {
    const message: ContactView = {
      id: randomUUID(),
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      subject: input.subject,
      message: input.message,
      resolved: false,
      createdAt: new Date().toISOString()
    };
    memoryStore.contacts.unshift(message);
    return message;
  }
  const message = await prisma.contactMessage.create({
    data: { ...input, phone: input.phone || null }
  });
  return mapContact(message);
}

export async function listContacts(): Promise<ContactView[]> {
  if (memoryModeEnabled()) return memoryStore.contacts;
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return messages.map((message) => mapContact(message));
}

export async function authenticateStaff(
  email: string,
  password: string
): Promise<StaffSession | null> {
  if (memoryModeEnabled()) {
    const expectedEmail = (process.env.ADMIN_EMAIL || "owner@food.go").toLowerCase();
    const expectedPassword = process.env.ADMIN_PASSWORD || "FoodGoDemo!2026";
    return email === expectedEmail && password === expectedPassword
      ? { id: "memory-owner", name: "Food.Go Owner", email: expectedEmail, role: "OWNER" }
      : null;
  }
  const staff = await prisma.staff.findUnique({ where: { email } });
  if (!staff?.active || !(await compare(password, staff.passwordHash))) return null;
  return { id: staff.id, name: staff.name, email: staff.email, role: staff.role };
}

export async function dashboardSummary() {
  if (memoryModeEnabled()) {
    return {
      ordersToday: memoryStore.orders.length,
      activeOrders: memoryStore.orders.filter(
        (order) => !["DELIVERED", "CANCELLED"].includes(order.status)
      ).length,
      revenueMinor: memoryStore.orders
        .filter((order) => order.status !== "CANCELLED")
        .reduce((sum, order) => sum + order.totalMinor, 0),
      pendingReviews: memoryStore.reviews.filter((review) => review.status === "PENDING").length,
      openMessages: memoryStore.contacts.filter((message) => !message.resolved).length
    };
  }
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [ordersToday, activeOrders, revenue, pendingReviews, openMessages] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: start } } }),
    prisma.order.count({
      where: { status: { in: ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"] } }
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: start }, status: { not: "CANCELLED" } },
      _sum: { totalMinor: true }
    }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.contactMessage.count({ where: { resolved: false } })
  ]);
  return {
    ordersToday,
    activeOrders,
    revenueMinor: revenue._sum.totalMinor ?? 0,
    pendingReviews,
    openMessages
  };
}

export async function recordAudit(
  staffId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown>,
  ipAddress?: string
) {
  if (memoryModeEnabled()) {
    memoryStore.audit.push({
      staffId,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress,
      createdAt: new Date().toISOString()
    });
    return;
  }
  await prisma.adminAuditLog.create({
    data: {
      staffId,
      action,
      entityType,
      entityId,
      metadata: metadata as Prisma.InputJsonValue,
      ipAddress
    }
  });
}
