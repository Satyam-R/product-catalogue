export interface Product {
  id: string;
  title: string;
  description: string;
  categorySlug: string;
  rating: number;
  priceCents: number;
}

export interface Category {
  slug: string;
  name: string;
}

export interface CatalogueResponse {
  categories: Category[];
  featured: Product[];
}

export interface CategoryResponse {
  category: Category;
  featured: Product[];
  additional: Product[];
}

export interface SearchResponse {
  products: Product[];
}

export interface ProductResponse {
  product: Product;
}

export interface EnquiryInput {
  name: string;
  email: string;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    fields?: Partial<Record<keyof EnquiryInput, string>>;
  };
}
