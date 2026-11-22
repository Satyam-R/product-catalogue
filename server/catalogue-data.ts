import type { Category, Product } from "../shared/contracts.js";

export const categories: readonly Category[] = [
  { slug: "desk", name: "Desk" },
  { slug: "kitchen", name: "Kitchen" },
  { slug: "travel", name: "Travel" },
];

export const featuredIds: readonly string[] = [
  "folding-laptop-stand",
  "cork-desk-mat",
  "stainless-steel-kettle",
  "glass-storage-set",
  "compact-travel-organizer",
];

export const products: readonly Product[] = [
  {
    id: "folding-laptop-stand",
    title: "Folding Laptop Stand",
    description: "An adjustable aluminum stand that folds flat for storage.",
    categorySlug: "desk",
    rating: 4.9,
    priceCents: 4200,
  },
  {
    id: "minimal-desk-lamp",
    title: "Minimal Desk Lamp",
    description: "A compact task light with a pivoting head and warm light.",
    categorySlug: "desk",
    rating: 4.8,
    priceCents: 5600,
  },
  {
    id: "cork-desk-mat",
    title: "Cork Desk Mat",
    description: "A smooth cork surface for a keyboard, mouse, and notebook.",
    categorySlug: "desk",
    rating: 4.8,
    priceCents: 2800,
  },
  {
    id: "wire-cable-clips",
    title: "Wire Cable Clips",
    description: "A set of six reusable clips that keep charging cables within reach.",
    categorySlug: "desk",
    rating: 4.5,
    priceCents: 900,
  },
  {
    id: "stainless-steel-kettle",
    title: "Stainless Steel Kettle",
    description: "A stovetop kettle with a stay-cool handle and a pour spout.",
    categorySlug: "kitchen",
    rating: 4.9,
    priceCents: 4800,
  },
  {
    id: "stackable-measuring-cups",
    title: "Stackable Measuring Cups",
    description: "Four clearly marked cups that nest together for storage.",
    categorySlug: "kitchen",
    rating: 4.8,
    priceCents: 1800,
  },
  {
    id: "glass-storage-set",
    title: "Glass Storage Set",
    description: "Three clear containers with snap lids for storing leftovers.",
    categorySlug: "kitchen",
    rating: 4.7,
    priceCents: 3200,
  },
  {
    id: "handheld-citrus-press",
    title: "Handheld Citrus Press",
    description: "A small lever press for squeezing lemons and limes.",
    categorySlug: "kitchen",
    rating: 4.6,
    priceCents: 1600,
  },
  {
    id: "compact-travel-organizer",
    title: "Compact Travel Organizer",
    description: "A zip organizer with pockets for cables, chargers, and adapters.",
    categorySlug: "travel",
    rating: 4.9,
    priceCents: 2600,
  },
  {
    id: "foldable-daypack",
    title: "Foldable Daypack",
    description: "A lightweight backpack that packs into its own front pocket.",
    categorySlug: "travel",
    rating: 4.8,
    priceCents: 3800,
  },
  {
    id: "stainless-steel-travel-mug",
    title: "Stainless Steel Travel Mug",
    description: "An insulated mug with a locking lid for drinks on the move.",
    categorySlug: "travel",
    rating: 4.7,
    priceCents: 3100,
  },
  {
    id: "soft-luggage-tag",
    title: "Soft Luggage Tag",
    description: "A flexible luggage tag with a covered address card.",
    categorySlug: "travel",
    rating: 4.5,
    priceCents: 800,
  },
];
