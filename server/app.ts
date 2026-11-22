import express from "express";
import type { ErrorRequestHandler, Express } from "express";
import { resolve } from "node:path";
import { rankCategoryProducts, searchProducts, selectFeatured } from "./catalogue.js";
import type { ProductSource } from "./catalogue.js";
import { validateContact } from "./enquiry.js";
import type { EnquiryFieldErrors, EnquiryMailer } from "./enquiry.js";

type AppOptions = {
  productSource: ProductSource;
  enquiryMailer: EnquiryMailer;
  staticPath?: string;
};

class RequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: EnquiryFieldErrors,
  ) {
    super(message);
  }
}

const handleError: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof RequestError) {
    response.status(error.status).json({ error: { message: error.message, fields: error.fields } });
    return;
  }

  if (error instanceof Error && "type" in error) {
    if (error.type === "entity.parse.failed") {
      response.status(400).json({ error: { message: "The enquiry must be valid JSON." } });
      return;
    }

    if (error.type === "entity.too.large") {
      response.status(413).json({ error: { message: "The enquiry is too large." } });
      return;
    }

    if (error.type === "charset.unsupported" || error.type === "encoding.unsupported") {
      response.status(415).json({ error: { message: "Send the enquiry as plain UTF-8 JSON." } });
      return;
    }
  }

  if (error instanceof URIError) {
    response.status(400).json({ error: { message: "This address is invalid." } });
    return;
  }

  // Request bodies and provider errors can include customer details.
  console.error("Unexpected catalogue request failure.");
  response.status(500).json({ error: { message: "Something went wrong. Please try again." } });
};

export function createApp({ productSource, enquiryMailer, staticPath }: AppOptions): Express {
  const app = express();
  const api = express.Router();

  app.disable("x-powered-by");
  app.use((_request, response, next) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });

  api.get("/catalogue", async (_request, response) => {
    const catalogue = await productSource.load();
    response.json({ categories: catalogue.categories, featured: selectFeatured(catalogue) });
  });

  api.get("/categories/:slug", async (request, response) => {
    const catalogue = await productSource.load();
    const category = catalogue.categories.find(({ slug }) => slug === request.params.slug);

    if (!category) {
      throw new RequestError(404, "Category not found.");
    }

    const ranked = rankCategoryProducts(catalogue.products, category.slug);
    response.json({ category, featured: ranked.slice(0, 3), additional: ranked.slice(3) });
  });

  api.get("/products", async (request, response) => {
    const query = request.query.q ?? "";

    if (typeof query !== "string") {
      throw new RequestError(400, "Enter a single search term.");
    }

    const catalogue = await productSource.load();
    response.json({ products: searchProducts(catalogue.products, query) });
  });

  async function requireProduct(id: string) {
    const catalogue = await productSource.load();
    const product = catalogue.products.find((item) => item.id === id);

    if (!product) {
      throw new RequestError(404, "Product not found.");
    }

    return product;
  }

  api.get("/products/:id", async (request, response) => {
    response.json({ product: await requireProduct(request.params.id) });
  });

  api.post("/products/:id/enquiries", express.json({ limit: "8kb", inflate: false }), async (request, response) => {
    const product = await requireProduct(request.params.id);
    const validation = validateContact(request.body);

    if ("fields" in validation) {
      throw new RequestError(400, "Check your contact details and try again.", validation.fields);
    }

    try {
      await enquiryMailer.send({ product, ...validation.contact });
    } catch {
      console.warn("The enquiry could not be delivered by SMTP.");
      throw new RequestError(503, "We couldn't send your enquiry. Please try again.");
    }

    response.status(204).end();
  });

  app.use("/api", api, (_request, _response, next) => {
    next(new RequestError(404, "API route not found."));
  });

  if (staticPath) {
    app.use(express.static(staticPath));
    app.get("/{*path}", (_request, response) => {
      response.sendFile(resolve(staticPath, "index.html"));
    });
  }

  app.use((_request, _response, next) => next(new RequestError(404, "Page not found.")));
  app.use(handleError);

  return app;
}
