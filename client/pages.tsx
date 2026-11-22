import { Link, useParams, useSearchParams } from 'react-router-dom';
import type { CatalogueResponse, CategoryResponse, Product, ProductResponse, SearchResponse } from '../shared/contracts';
import { errorMessage, RequestError, useResource } from './api';
import { Enquiry } from './enquiry';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function ProductArt({ product }: { product: Product }) {
  return (
    <div className="product-art" data-category={product.categorySlug} aria-hidden="true">
      <span className="art-object" />
    </div>
  );
}

function ProductMeta({ product }: { product: Product }) {
  return (
    <div className="product-meta">
      <span>{currency.format(product.priceCents / 100)}</span>
      <span className="rating">
        <span aria-hidden="true">★</span>
        <span className="visually-hidden">Rated </span> {product.rating.toFixed(1)}
        <span className="visually-hidden"> out of 5</span>
      </span>
    </div>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="product-grid">
      {products.map((product) => (
        <li key={product.id}>
          <Link className="product-card" to={`/products/${encodeURIComponent(product.id)}`}>
            <ProductArt product={product} />
            <div className="card-copy">
              <h3>{product.title}</h3>
              <ProductMeta product={product} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Loading({ children = 'Loading products…' }: { children?: string }) {
  return <p className="notice" role="status">{children}</p>;
}

export function LoadError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="notice" role="alert">
      <p>{errorMessage(error, 'We could not load the catalogue. Please try again.')}</p>
      <button className="button-secondary" type="button" onClick={retry}>Try again</button>
    </div>
  );
}

export function Home({ catalogue }: { catalogue: ReturnType<typeof useResource<CatalogueResponse>> }) {
  return (
    <>
      <div className="hero">
        <div className="hero-copy">
          <h1>Everyday goods.</h1>
          <p>A small collection for your desk, kitchen, and travels.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span /><span /><span />
        </div>
      </div>
      <section className="product-section" aria-labelledby="featured-title">
        <h2 id="featured-title">Featured products</h2>
        {catalogue.status === 'loading' && <Loading />}
        {catalogue.status === 'error' && <LoadError error={catalogue.error} retry={catalogue.retry} />}
        {catalogue.status === 'ready' && <ProductGrid products={catalogue.data.featured} />}
      </section>
    </>
  );
}

export function NotFound({ title = 'Page not found' }: { title?: string }) {
  return (
    <div className="notice not-found">
      <h1>{title}</h1>
      <Link className="text-link" to="/">Back to the catalogue</Link>
    </div>
  );
}

export function CategoryPage() {
  const { slug = '' } = useParams();
  const result = useResource<CategoryResponse>(`/api/categories/${encodeURIComponent(slug)}`);

  if (result.status === 'loading') return <Loading>Loading category…</Loading>;
  if (result.status === 'error') {
    if (result.error instanceof RequestError && result.error.status === 404) {
      return <NotFound title="Category not found" />;
    }
    return <LoadError error={result.error} retry={result.retry} />;
  }

  const { category, featured, additional } = result.data;
  return (
    <>
      <h1 className="page-title">{category.name}</h1>
      <section className="product-section" aria-labelledby="rated-title">
        <h2 id="rated-title">Top rated</h2>
        {featured.length ? <ProductGrid products={featured} /> : <p>No products in this category yet.</p>}
      </section>
      {additional.length > 0 && (
        <section className="product-section" aria-labelledby="additional-title">
          <h2 id="additional-title">More in {category.name}</h2>
          <ProductGrid products={additional} />
        </section>
      )}
    </>
  );
}

export function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q')?.trim() ?? '';
  const result = useResource<SearchResponse>(query ? `/api/products?${new URLSearchParams({ q: query })}` : null);

  return (
    <>
      <h1 className="page-title">Search results</h1>
      {!query && <p className="notice">Enter a product name or keyword to search the catalogue.</p>}
      {query && result.status === 'loading' && <Loading>Searching the catalogue…</Loading>}
      {query && result.status === 'error' && <LoadError error={result.error} retry={result.retry} />}
      {query && result.status === 'ready' && (
        <section className="product-section" aria-labelledby="results-title">
          <h2 className="results-heading" id="results-title">
            {result.data.products.length} {result.data.products.length === 1 ? 'match' : 'matches'} for “{query}”
          </h2>
          {result.data.products.length
            ? <ProductGrid products={result.data.products} />
            : <p>Try another product name or a shorter keyword.</p>}
        </section>
      )}
    </>
  );
}

export function ProductPage({ catalogue }: { catalogue: ReturnType<typeof useResource<CatalogueResponse>> }) {
  const { id = '' } = useParams();
  const result = useResource<ProductResponse>(`/api/products/${encodeURIComponent(id)}`);

  if (result.status === 'loading') return <Loading>Loading product…</Loading>;
  if (result.status === 'error') {
    if (result.error instanceof RequestError && result.error.status === 404) {
      return <NotFound title="Product not found" />;
    }
    return <LoadError error={result.error} retry={result.retry} />;
  }

  const { product } = result.data;
  const category = catalogue.status === 'ready'
    ? catalogue.data.categories.find(({ slug }) => slug === product.categorySlug)
    : undefined;

  return (
    <article className="product-detail">
      <ProductArt product={product} />
      <div className="detail-copy">
        {category && <Link className="text-link" to={`/categories/${encodeURIComponent(category.slug)}`}>{category.name}</Link>}
        <h1>{product.title}</h1>
        <ProductMeta product={product} />
        <p className="product-description">{product.description}</p>
        <Enquiry key={product.id} product={product} />
      </div>
    </article>
  );
}
