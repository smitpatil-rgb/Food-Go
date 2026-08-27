import type { ContactView, MenuItemView, OrderView, ReviewView } from "./domain";

type MemoryStore = {
  menu: MenuItemView[];
  orders: OrderView[];
  reviews: ReviewView[];
  contacts: ContactView[];
  idempotency: Map<string, string>;
  audit: Array<Record<string, unknown>>;
};

const globalForMemory = globalThis as unknown as { foodgoMemoryStore?: MemoryStore };

const seedStore: MemoryStore = {
  menu: [
    {
      id: "menu-pasta",
      name: "Wild Tomato Penne",
      slug: "wild-tomato-penne",
      description: "Slow-roasted tomato, peppery rocket, basil oil and toasted seed crunch.",
      priceMinor: 34900,
      imageUrl: "/images/bg.jpg",
      dietaryLabels: ["Vegetarian", "High protein"],
      ratingHundredths: 480,
      prepMinutes: 22,
      featured: true,
      active: true,
      category: { name: "Mains", slug: "mains" }
    },
    {
      id: "menu-salad",
      name: "Garden Signal Salad",
      slug: "garden-signal-salad",
      description: "Market leaves, charred citrus, avocado and a sharp green herb dressing.",
      priceMinor: 28900,
      imageUrl: "/images/menu1.jpg",
      dietaryLabels: ["Vegan", "Gluten-free"],
      ratingHundredths: 470,
      prepMinutes: 14,
      featured: true,
      active: true,
      category: { name: "Greens", slug: "greens" }
    },
    {
      id: "menu-soup",
      name: "Ember Tomato Soup",
      slug: "ember-tomato-soup",
      description: "Fire-roasted tomato, smoked chilli, cultured cream and sourdough crumb.",
      priceMinor: 23900,
      imageUrl: "/images/menu2.jpg",
      dietaryLabels: ["Vegetarian"],
      ratingHundredths: 460,
      prepMinutes: 16,
      featured: false,
      active: true,
      category: { name: "Small plates", slug: "small-plates" }
    },
    {
      id: "menu-pasta-primavera",
      name: "Spring Market Pasta",
      slug: "spring-market-pasta",
      description: "Silky pasta with seasonal greens, parmesan, lemon and cracked pepper.",
      priceMinor: 32900,
      imageUrl: "/images/menu3.jpg",
      dietaryLabels: ["Vegetarian"],
      ratingHundredths: 490,
      prepMinutes: 20,
      featured: true,
      active: true,
      category: { name: "Mains", slug: "mains" }
    },
    {
      id: "menu-salad-crunch",
      name: "Crisp Harvest Bowl",
      slug: "crisp-harvest-bowl",
      description: "Crunchy vegetables, toasted grains, herbs and our bright house vinaigrette.",
      priceMinor: 30900,
      imageUrl: "/images/menu4.jpg",
      dietaryLabels: ["Vegan"],
      ratingHundredths: 450,
      prepMinutes: 15,
      featured: false,
      active: true,
      category: { name: "Greens", slug: "greens" }
    },
    {
      id: "menu-chicken",
      name: "Green Fire Chicken",
      slug: "green-fire-chicken",
      description: "Charred free-range chicken, coriander relish, crisp greens and lime jus.",
      priceMinor: 45900,
      imageUrl: "/images/menu6.jpg",
      dietaryLabels: ["Gluten-free", "High protein"],
      ratingHundredths: 490,
      prepMinutes: 28,
      featured: true,
      active: true,
      category: { name: "Mains", slug: "mains" }
    }
  ],
  orders: [],
  reviews: [
    {
      id: "review-1",
      authorName: "Rohan S.",
      rating: 5,
      body: "The pasta arrived hot, bright and genuinely restaurant-level. Ordering was effortless.",
      status: "APPROVED",
      menuItemId: "menu-pasta",
      createdAt: new Date("2026-07-20T10:00:00Z").toISOString()
    },
    {
      id: "review-2",
      authorName: "Priya M.",
      rating: 5,
      body: "Crisp vegetables, smart packaging and delivery exactly when promised.",
      status: "APPROVED",
      menuItemId: "menu-salad",
      createdAt: new Date("2026-07-22T10:00:00Z").toISOString()
    }
  ],
  contacts: [],
  idempotency: new Map(),
  audit: []
};

export const memoryStore = globalForMemory.foodgoMemoryStore ?? seedStore;
globalForMemory.foodgoMemoryStore = memoryStore;

export function resetMemoryStore() {
  memoryStore.orders.splice(0);
  memoryStore.contacts.splice(0);
  memoryStore.idempotency.clear();
  memoryStore.reviews.splice(2);
  memoryStore.audit.splice(0);
}
