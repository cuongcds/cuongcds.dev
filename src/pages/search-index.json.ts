import type { APIRoute } from 'astro';
import { posts, products } from '../lib/content';
export const GET: APIRoute = () => Response.json([
  ...products.map(p => ({ title: p.name, description: p.tagline, url: `/${p.id}/`, kind: 'project', tags: p.keywords })),
  ...posts.map(p => ({ title: p.title, description: p.description, url: `/blog/${p.id}/`, kind: 'article', tags: p.tags })),
]);
