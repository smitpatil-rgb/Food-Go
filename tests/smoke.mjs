import { access } from "node:fs/promises";

const required = [
  "src/app/page.tsx",
  "src/app/api/orders/route.ts",
  "src/app/api/orders/track/route.ts",
  "src/app/admin/page.tsx",
  "prisma/schema.prisma",
  ".env.example"
];

await Promise.all(required.map((file) => access(file)));

if (process.env.BASE_URL) {
  const response = await fetch(process.env.BASE_URL);
  if (!response.ok) throw new Error(`Home page returned ${response.status}`);
}

console.log(`Food.Go smoke check passed (${required.length} critical files).`);
