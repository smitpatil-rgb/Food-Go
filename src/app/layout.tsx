import type { Metadata } from "next";
import "./globals.css";
import { AppFrame } from "@/components/app-frame";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "Food.Go — Dinner, in motion", template: "%s · Food.Go" },
  description:
    "Ingredient-led food, prepared with intent and delivered while it still feels alive.",
  openGraph: {
    title: "Food.Go — Dinner, in motion",
    description:
      "Ingredient-led food, prepared with intent and delivered while it still feels alive.",
    images: [
      { url: "/images/bg.jpg", width: 2049, height: 1152, alt: "Food.Go fresh tomato pasta" }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Food.Go — Dinner, in motion",
    description: "Ingredient-led food, prepared with intent."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
