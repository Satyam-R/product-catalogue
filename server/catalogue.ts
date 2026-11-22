import type { Category, Product } from "../shared/contracts.js";
import { categories, featuredIds, products } from "./catalogue-data.js";

type CatalogueSnapshot = {
  readonly categories: readonly Category[];
  readonly products: readonly Product[];
  readonly featuredIds: readonly string[];
};

export interface ProductSource {
  load(): Promise<CatalogueSnapshot>;
}

export class BundledProductSource implements ProductSource {
  async load(): Promise<CatalogueSnapshot> {
    return { categories, products, featuredIds };
  }
}

export function selectFeatured(catalogue: CatalogueSnapshot): Product[] {
  const productsById = new Map(catalogue.products.map((product) => [product.id, product]));

  return catalogue.featuredIds.map((id) => {
    const product = productsById.get(id);

    if (!product) {
      throw new Error("A featured product is missing from the catalogue.");
    }

    return product;
  });
}

export function rankCategoryProducts(items: readonly Product[], slug: string): Product[] {
  return items
    .filter((product) => product.categorySlug === slug)
    .sort((left, right) => right.rating - left.rating || left.id.localeCompare(right.id));
}

export function searchProducts(items: readonly Product[], query: string): Product[] {
  const term = query.trim().toLowerCase();

  if (!term) {
    return [];
  }

  return items.filter((product) => (
    product.title.toLowerCase().includes(term)
    || product.description.toLowerCase().includes(term)
  ));
}
