import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { memoryStore } from "../src/lib/memory-store";

const prisma = new PrismaClient();

async function main() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12)
    throw new Error("Set ADMIN_PASSWORD to at least 12 characters before seeding.");
  const email = (process.env.ADMIN_EMAIL || "owner@food.go").toLowerCase();
  await prisma.restaurantSettings.upsert({
    where: { id: "primary" },
    update: {},
    create: { id: "primary" }
  });
  await prisma.staff.upsert({
    where: { email },
    update: { passwordHash: await hash(password, 12), active: true },
    create: { name: "Food.Go Owner", email, passwordHash: await hash(password, 12), role: "OWNER" }
  });
  for (const source of memoryStore.menu) {
    const category = await prisma.category.upsert({
      where: { slug: source.category.slug },
      update: { name: source.category.name },
      create: { name: source.category.name, slug: source.category.slug }
    });
    await prisma.menuItem.upsert({
      where: { slug: source.slug },
      update: { ...source, id: undefined, category: undefined, categoryId: category.id },
      create: {
        name: source.name,
        slug: source.slug,
        description: source.description,
        priceMinor: source.priceMinor,
        imageUrl: source.imageUrl,
        dietaryLabels: source.dietaryLabels,
        ratingHundredths: source.ratingHundredths,
        prepMinutes: source.prepMinutes,
        featured: source.featured,
        active: source.active,
        categoryId: category.id
      }
    });
  }
  if ((await prisma.review.count()) === 0) {
    await prisma.review.createMany({
      data: memoryStore.reviews.map((review) => ({
        authorName: review.authorName,
        rating: review.rating,
        body: review.body,
        status: review.status
      }))
    });
  }
}

main().finally(() => prisma.$disconnect());
