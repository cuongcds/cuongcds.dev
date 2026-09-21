import { getCollection } from 'astro:content';
import experimentsJson from '../content/experiments.json';
import companyJson from '../content/company.json';
import statsJson from '../generated/stats.json';

type Stats = {
  products: Record<string, { stars?: number; downloads?: number } | undefined>;
  experiments: Record<string, { stars?: number } | undefined>;
};
const stats = statsJson as Stats;
export const products = (await getCollection('products')).map(({ id, data }) => ({
  ...data, id,
  stars: stats.products[id]?.stars ?? data.stars,
  downloads: stats.products[id]?.downloads || undefined,
})).sort((a, b) => a.order - b.order);
export type Product = typeof products[number];
export const productById = (id: string) => products.find(p => p.id === id);

export const blogEntries = (await getCollection('blog'))
  .filter(p => !p.data.draft && p.data.publishDate <= new Date())
  .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
export const posts = blogEntries.map(p => ({
  ...p.data, id: p.id, body: p.body ?? '',
  wordCount: (p.body ?? '').split(/\s+/).filter(Boolean).length,
}));
export type Post = typeof posts[number];
export const postById = (id: string) => posts.find(p => p.id === id);
export const gallery = (await getCollection('gallery')).map(({ id, data }) => ({ id, ...data }));
export type GalleryShot = typeof gallery[number];
export const experiments = experimentsJson.map(x => ({
  ...x, stars: stats.experiments[x.id]?.stars ?? x.stars,
})).sort((a, b) => a.id.localeCompare(b.id));
export const company = companyJson;
export const totalStars = products.reduce((sum, p) => sum + (p.stars ?? 0), 0)
  + experiments.reduce((sum, p) => sum + p.stars, 0);
