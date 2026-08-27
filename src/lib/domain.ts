export const ORDER_STATUSES = [
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED"
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentMethod = "COD" | "UPI_ON_DELIVERY";
export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export type MenuItemView = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceMinor: number;
  imageUrl: string;
  dietaryLabels: string[];
  ratingHundredths: number;
  prepMinutes: number;
  featured: boolean;
  active: boolean;
  category: { name: string; slug: string };
};

export type OrderView = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string | null;
  deliveryAddress: string;
  notes: string | null;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  subtotalMinor: number;
  deliveryFeeMinor: number;
  taxMinor: number;
  totalMinor: number;
  createdAt: string;
  items: Array<{
    id: string;
    menuItemId: string;
    nameSnapshot: string;
    priceMinor: number;
    quantity: number;
  }>;
  statusEvents: Array<{ id: string; status: OrderStatus; note: string | null; createdAt: string }>;
};

export type ReviewView = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  menuItemId: string | null;
  createdAt: string;
};

export type ContactView = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  resolved: boolean;
  createdAt: string;
};

export type StaffSession = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "KITCHEN";
};
