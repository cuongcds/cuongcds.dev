import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { pages, type PageData } from '../../lib/page-data';

export function getStaticPaths() {
  return pages.map(page => ({ params: { slug: page.image.split('/').pop()!.replace('.png', '') }, props: { page } }));
}
const font = readFile(new URL('../../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff', import.meta.url));
export const GET: APIRoute = async ({ props }) => {
  const page = props.page as PageData;
  const svg = await satori({ type: 'div', key: null, props: {
    style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', padding: '64px', background: '#faf9f6', color: '#191919', fontFamily: 'IBM Plex Mono' },
    children: [
      { type: 'div', props: { style: { fontSize: 24 }, children: 'palash.dev / ' + (page.post ? 'writing' : page.product ? 'work' : 'Palash Debnath') } },
      { type: 'div', props: { style: { fontSize: page.title.length > 65 ? 42 : 52, lineHeight: 1.15 }, children: page.title } },
      { type: 'div', props: { style: { fontSize: 24, lineHeight: 1.4 }, children: page.description.length > 190 ? page.description.slice(0, 187) + '…' : page.description } },
    ],
  } }, { width: 1200, height: 630, fonts: [{ name: 'IBM Plex Mono', data: await font, weight: 400, style: 'normal' }] });
  const png = new Resvg(svg).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
