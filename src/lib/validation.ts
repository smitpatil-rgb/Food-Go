import { z } from "zod";
import { ORDER_STATUSES } from "./domain";

const phone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[^0-9+]/g, ""))
  .refine((value) => /^\+?[0-9]{10,15}$/.test(value), "Enter a valid phone number");

export const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone,
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  deliveryAddress: z.string().trim().min(10).max(500),
  notes: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(["COD", "UPI_ON_DELIVERY"]),
  idempotencyKey: z.string().uuid(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(20)
      })
    )
    .min(1)
    .max(30)
});

export const trackingSchema = z.object({
  orderNumber: z.string().trim().toUpperCase().min(8).max(40),
  phone
});

export const reviewSchema = z.object({
  authorName: z.string().trim().min(2).max(80),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(10).max(1000),
  menuItemId: z.string().optional()
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(150),
  phone: z.union([phone, z.literal("")]).optional(),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000)
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200)
});

export const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().max(250).optional()
});

export const menuItemSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(10).max(800),
  priceMinor: z.number().int().min(100).max(1_000_000),
  imageUrl: z.string().trim().startsWith("/images/"),
  dietaryLabels: z.array(z.string().trim().min(1).max(30)).max(8),
  ratingHundredths: z.number().int().min(0).max(500),
  prepMinutes: z.number().int().min(1).max(180),
  featured: z.boolean(),
  active: z.boolean(),
  categoryName: z.string().trim().min(2).max(60),
  categorySlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
});

export const reviewModerationSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"])
});
