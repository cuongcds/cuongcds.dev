# palash.dev

Arcade-inspired portfolio and blog. Astro 7 builds static HTML; Solid handles search and gallery interactions. Base UI React tabs are isolated to the publishing preview. Unhead 3 renders metadata and JSON-LD at build time.

## Development

```sh
npm ci
npm run dev          # localhost:3003
npm run lint
npm test
npm run build        # static output in dist/
npm run test:site    # production HTML and assets
npm run test:browser # build first; launches local preview
npm run seo:audit    # build + metadata/schema/crawl audit
npm run deploy       # audit, test, and publish to Cloudflare
```

Browser checks use Chromium (`CHROMIUM_PATH`, default `/usr/bin/chromium`).

## Publishing

- `src/content/blog/`: Markdown/MDX. Required frontmatter: title, description, publishDate. Optional: updatedDate, tags, draft. Drafts and future posts are excluded.
- `src/content/products/`: project JSON validated by Astro content collections.
- `src/lib/page-data.ts`: metadata and Person, WebSite, BlogPosting, SoftwareApplication, breadcrumb and collection schemas.
- `src/lib/head.ts`: canonical, robots, Open Graph, Twitter, alternate links and JSON-LD through Unhead.
- `/preview/`: search snippets, social images, schema and rendered-head inspection. Preview and search are noindex.
- `/social/*.png`: generated 1200×630 cards from page metadata. Historical OG assets remain available.
- RSS, sitemaps, Markdown mirrors, llms.txt and résumé downloads remain available. No hidden keyword copy or bot-only content.

The original arcade-road shell uses self-hosted Fontsource type and code-native SVG scenery. Reading pages remain static HTML; only search, galleries, and the publishing preview load framework islands. Legacy `/os/` redirects home.

## Metrics and deployment

GitHub stats refresh with cached fallback. Public download totals count binary/archive assets from stable releases, excluding prereleases, checksums, updater metadata and scripts. Registry pulls remain separate. Tests cover counting and token sanitization.

Static assets deploy through `wrangler.jsonc`; `public/_headers` controls caching and Markdown content types. SEO checks run locally, not as hidden page content. Metadata cannot guarantee indexing or AI citations.
