import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import solid from '@astrojs/solid-js';
import { refreshStats } from './scripts/stats-pipeline.mjs';

export default defineConfig({
  site: 'https://palash.dev',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    react({ include: ['**/islands/react/**'] }),
    solid({ include: ['**/islands/solid/**'] }),
    { name: 'portfolio:stats', hooks: { 'astro:config:setup': async ({ command }) => { if (command === 'build') await refreshStats(); } } },
  ],
  markdown: { syntaxHighlight: false },
  devToolbar: { enabled: false },
  server: { host: '127.0.0.1', port: 3003 },
  vite: { server: { watch: { usePolling: true, interval: 250 } } },
});
