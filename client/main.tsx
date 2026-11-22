import { StrictMode, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { CatalogueResponse, Category } from '../shared/contracts';
import { useResource } from './api';
import { CategoryPage, Home, NotFound, ProductPage, SearchPage } from './pages';
import './styles.css';

function SearchForm({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const navigate = useNavigate();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = value.trim();
    navigate(query ? `/search?${new URLSearchParams({ q: query })}` : '/search');
  }

  return (
    <form className="site-search" role="search" onSubmit={submit}>
      <label className="visually-hidden" htmlFor="site-search">Search products</label>
      <input
        id="site-search"
        type="search"
        name="q"
        placeholder="Search products"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  );
}

function Header({ categories }: { categories: Category[] }) {
  const location = useLocation();
  const query = location.pathname === '/search' ? new URLSearchParams(location.search).get('q') ?? '' : '';

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true" />Fieldwork Supply
        </Link>
        {categories.length > 0 && (
          <nav className="category-nav" aria-label="Product categories">
            {categories.map((category) => (
              <NavLink key={category.slug} to={`/categories/${encodeURIComponent(category.slug)}`}>
                {category.name}
              </NavLink>
            ))}
          </nav>
        )}
        <SearchForm key={`${location.pathname}${location.search}`} initialValue={query} />
      </div>
    </header>
  );
}

function App() {
  const catalogue = useResource<CatalogueResponse>('/api/catalogue');
  const location = useLocation();
  const main = useRef<HTMLElement>(null);
  const previousLocation = useRef(location.key);

  useEffect(() => {
    if (previousLocation.current === location.key) return;
    previousLocation.current = location.key;
    main.current?.focus();
    window.scrollTo(0, 0);
  }, [location.key]);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header categories={catalogue.status === 'ready' ? catalogue.data.categories : []} />
      <main className="main-content" id="main-content" tabIndex={-1} ref={main}>
        <Routes>
          <Route path="/" element={<Home catalogue={catalogue} />} />
          <Route path="/categories/:slug" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/products/:id" element={<ProductPage catalogue={catalogue} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter><App /></BrowserRouter>
  </StrictMode>,
);
