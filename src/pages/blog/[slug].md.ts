import type { APIRoute } from 'astro';
import { posts } from '../../lib/content';
import { servePostMarkdown } from '../../lib/post-markdown';
export function getStaticPaths() { return posts.map(post => ({ params: { slug: post.id } })); }
export const GET: APIRoute = ({ request }) => servePostMarkdown(request) ?? new Response('Not found', { status: 404 });
