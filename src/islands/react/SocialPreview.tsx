/** @jsxImportSource react */
import { useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';

export interface PreviewPage { title: string; description: string; path: string; image: string; canonical: string; schema: string; head: string }
export default function SocialPreview({ pages }: { pages: PreviewPage[] }) {
  const [path, setPath] = useState(pages[0].path);
  const page = pages.find(p => p.path === path)!;
  return <section aria-label="Publishing preview">
    <p><label htmlFor="preview-page">Page </label><select id="preview-page" value={path} onChange={e => setPath(e.target.value)}>{pages.map(p => <option key={p.path} value={p.path}>{p.path}</option>)}</select></p>
    <Tabs.Root defaultValue="search">
      <Tabs.List aria-label="Preview format">
        <Tabs.Tab value="search">Search</Tabs.Tab><Tabs.Tab value="social">Social card</Tabs.Tab><Tabs.Tab value="schema">Schema</Tabs.Tab><Tabs.Tab value="head">Meta tags</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="search"><p>{page.canonical}</p><h2><a href={page.path}>{page.title}</a></h2><p>{page.description}</p><p>{page.title.length} title characters · {page.description.length} description characters</p></Tabs.Panel>
      <Tabs.Panel value="social"><h2>Social card</h2><img src={page.image} width="1200" height="630" alt={page.title} /><h3>{page.title}</h3><p>{page.description}</p><p>palash.dev · 1200 × 630 PNG</p><a href={page.image} download>Download image</a></Tabs.Panel>
      <Tabs.Panel value="schema"><h2>JSON-LD</h2><pre><code>{page.schema}</code></pre></Tabs.Panel>
      <Tabs.Panel value="head"><h2>Rendered head</h2><pre><code>{page.head}</code></pre></Tabs.Panel>
    </Tabs.Root>
  </section>;
}
