import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test, type TestContext } from 'node:test';
import { createApp } from '../server/app.js';
import { BundledProductSource } from '../server/catalogue.js';
import type { EnquiryMailer } from '../server/enquiry.js';
import type {
  ApiErrorResponse,
  CatalogueResponse,
  CategoryResponse,
  ProductResponse,
  SearchResponse,
} from '../shared/contracts.js';

type Enquiry = Parameters<EnquiryMailer['send']>[0];

class RecordingMailer implements EnquiryMailer {
  readonly messages: Enquiry[] = [];

  constructor(private readonly failure?: Error) {}

  async send(enquiry: Enquiry): Promise<void> {
    this.messages.push(enquiry);
    if (this.failure) throw this.failure;
  }
}

async function startApi(t: TestContext, mailer = new RecordingMailer()) {
  const app = createApp({ productSource: new BundledProductSource(), enquiryMailer: mailer });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const address = server.address();
  assert(address && typeof address === 'object');

  return {
    get: (path: string) => fetch(`http://127.0.0.1:${address.port}${path}`),
    postEnquiry: (id: string, body: string) => fetch(
      `http://127.0.0.1:${address.port}/api/products/${id}/enquiries`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body },
    ),
    mailer,
  };
}

const productId = 'folding-laptop-stand';
const contact = { name: 'Avery Cole', email: 'avery@example.test' };

test('the home API returns all three categories and exactly the five chosen products', async (t) => {
  const api = await startApi(t);
  const response = await api.get('/api/catalogue');
  assert.equal(response.status, 200);

  const { categories, featured } = await response.json() as CatalogueResponse;
  assert.deepEqual(categories.map(({ slug }) => slug), ['desk', 'kitchen', 'travel']);
  assert.deepEqual(featured.map(({ id }) => id), [
    productId,
    'cork-desk-mat',
    'stainless-steel-kettle',
    'glass-storage-set',
    'compact-travel-organizer',
  ]);
});

test('a category ranks three products, breaks rating ties by ID, and lists the remainder', async (t) => {
  const api = await startApi(t);
  const response = await api.get('/api/categories/desk');
  assert.equal(response.status, 200);

  const { category, featured, additional } = await response.json() as CategoryResponse;
  assert.equal(category.slug, 'desk');
  assert.deepEqual(featured.map(({ id }) => id), [
    productId,
    'cork-desk-mat',
    'minimal-desk-lamp',
  ]);
  assert.deepEqual(additional.map(({ id }) => id), ['wire-cable-clips']);
  assert.equal(featured[1].rating, featured[2].rating);

  const missing = await api.get('/api/categories/missing');
  assert.equal(missing.status, 404);
  await missing.json();
});

test('search trims whitespace, ignores case, and looks in both titles and descriptions', async (t) => {
  const api = await startApi(t);
  const titleSearch = new URLSearchParams({ q: '  STAINLESS STEEL  ' });
  const titleResponse = await api.get(`/api/products?${titleSearch}`);
  assert.equal(titleResponse.status, 200);
  const { products } = await titleResponse.json() as SearchResponse;
  assert.deepEqual(
    products.map(({ id }) => id).sort(),
    ['stainless-steel-kettle', 'stainless-steel-travel-mug'],
  );

  const descriptionSearch = new URLSearchParams({ q: 'adjustable aluminum' });
  const descriptionResponse = await api.get(`/api/products?${descriptionSearch}`);
  assert.equal(descriptionResponse.status, 200);
  const descriptionResults = await descriptionResponse.json() as SearchResponse;
  assert.deepEqual(descriptionResults.products.map(({ id }) => id), [productId]);
});

test('search returns an empty list for blank and unmatched queries', async (t) => {
  const api = await startApi(t);

  for (const q of ['  ', 'zzz-no-catalogue-product']) {
    const response = await api.get(`/api/products?${new URLSearchParams({ q })}`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { products: [] });
  }
});

test('a product can be loaded by ID and an unknown ID returns 404', async (t) => {
  const api = await startApi(t);
  const response = await api.get(`/api/products/${productId}`);
  assert.equal(response.status, 200);
  const { product } = await response.json() as ProductResponse;
  assert.equal(product.id, productId);
  assert.equal(product.title, 'Folding Laptop Stand');
  assert.ok(product.description.length > 0);

  const missing = await api.get('/api/products/missing');
  assert.equal(missing.status, 404);
  assert.equal(typeof (await missing.json()).error.message, 'string');
});

test('valid contact details are trimmed before sending an enquiry for the selected product', async (t) => {
  const api = await startApi(t);
  const response = await api.postEnquiry(productId, JSON.stringify({
    name: `  ${contact.name}  `,
    email: `  ${contact.email}  `,
  }));

  assert.equal(response.status, 204);
  assert.deepEqual(api.mailer.messages.map(({ product, name, email }) => ({
    product: product.id,
    name,
    email,
  })), [{ product: productId, ...contact }]);
});

test('validation and unknown products keep enquiries from reaching the mailer', async (t) => {
  const api = await startApi(t);
  const invalid = await api.postEnquiry(productId, JSON.stringify({ name: ' ', email: 'invalid' }));
  assert.equal(invalid.status, 400);
  const { error } = await invalid.json() as ApiErrorResponse;
  assert.equal(typeof error.fields?.name, 'string');
  assert.equal(typeof error.fields?.email, 'string');

  const missing = await api.postEnquiry('missing', JSON.stringify(contact));
  assert.equal(missing.status, 404);
  await missing.json();
  assert.deepEqual(api.mailer.messages, []);
});

test('malformed and oversized enquiry bodies return client errors without calling the mailer', async (t) => {
  const api = await startApi(t);
  const malformed = await api.postEnquiry(productId, '{"name":');
  assert.equal(malformed.status, 400);
  assert.equal(typeof (await malformed.json()).error.message, 'string');

  const oversized = await api.postEnquiry(productId, JSON.stringify({ ...contact, name: 'x'.repeat(9000) }));
  assert.equal(oversized.status, 413);
  assert.equal(typeof (await oversized.json()).error.message, 'string');
  assert.deepEqual(api.mailer.messages, []);
});

test('SMTP failure returns a retryable status with no internal transport details', async (t) => {
  const transportDetail = 'private SMTP relay diagnostic';
  const api = await startApi(t, new RecordingMailer(new Error(transportDetail)));
  const response = await api.postEnquiry(productId, JSON.stringify(contact));

  assert.equal(response.status, 503);
  assert.equal(api.mailer.messages.length, 1);
  const { error } = await response.json() as ApiErrorResponse;
  assert.equal(typeof error.message, 'string');
  assert.ok(!error.message.includes(transportDetail));
});
