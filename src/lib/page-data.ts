import { SITE } from '../site.config';
import { posts, products, type Post, type Product } from './content';

export interface PageData {
  path: string;
  title: string;
  description: string;
  image: string;
  kind: 'ProfilePage' | 'CollectionPage' | 'WebPage' | 'ContactPage';
  noIndex?: boolean;
  post?: Post;
  product?: Product;
}
const page = (path: string, title: string, description: string, image: string, kind: PageData['kind'] = 'WebPage'): PageData => ({ path, title, description, image, kind });
const metaDescription = (value: string) => {
  if (value.length <= 160) return value;
  const firstSentence = value.match(/^.*?[.!?](?:\s|$)/)?.[0].trim();
  if (firstSentence && firstSentence.length <= 160) return firstSentence;
  return `${value.slice(0, 156).replace(/\s+\S*$/, '')}…`;
};
export const pages: PageData[] = [
  page('/', 'Palash Debnath — Software engineer', SITE.description, '/social/home.png', 'ProfilePage'),
  page('/blog/', 'Writing — Palash Debnath', 'Notes on software, AI, and building open-source tools.', '/social/blog.png', 'CollectionPage'),
  page('/lab/', 'Experiments — Palash Debnath', 'Small open-source projects and developer tools by Palash Debnath.', '/social/lab.png', 'CollectionPage'),
  page('/media/', 'Screenshots — Palash Debnath', 'Desktop and terminal interfaces from VoiceStudio, Bootable, Opal, and memXT.', '/social/media.png', 'CollectionPage'),
  page('/contact/', 'Contact — Palash Debnath', 'Email, GitHub, and social links for Palash Debnath.', '/social/contact.png', 'ContactPage'),
  page('/resume/', 'Résumé — Palash Debnath', 'Software engineering experience, skills, and open-source projects. PDF, text, and JSON downloads.', '/social/resume.png', 'ProfilePage'),
  { ...page('/search/', 'Search — palash.dev', 'Search Palash Debnath’s open-source projects, products, experiments, and engineering articles.', '/social/search.png'), noIndex: true },
  { ...page('/preview/', 'Publishing preview — palash.dev', 'Inspect every page’s search metadata, social preview card, and structured data before publishing.', '/social/preview.png'), noIndex: true },
  ...products.map(p => ({ ...page(`/${p.id}/`, `${p.name} — ${p.tagline}`, metaDescription(p.description), `/social/${p.id}.png`), product: p })),
  ...posts.map(p => ({ ...page(`/blog/${p.id}/`, p.title, p.description, `/social/blog-${p.id}.png`), post: p })),
];
export const pageByPath = (path: string) => {
  const result = pages.find(p => p.path === path);
  if (!result) throw new Error(`Missing page metadata: ${path}`);
  return result;
};
export const canonical = (path: string) => new URL(path, SITE.url).href;
export function schemaFor(page: PageData) {
  const url = canonical(page.path);
  const person = { '@type': 'Person', '@id': `${SITE.url}/#person`, name: SITE.author,
    alternateName: [SITE.handle, SITE.xHandle], url: `${SITE.url}/`, image: canonical(SITE.avatar),
    jobTitle: 'Software Engineer and Product Builder', sameAs: [SITE.github, SITE.x],
    homeLocation: { '@type': 'Place', name: 'Agartala, Tripura, India' } };
  const entityId = page.post ? `${url}#article` : page.product ? `${url}#app` : page.kind === 'ProfilePage' ? person['@id'] : undefined;
  const graph: Record<string, unknown>[] = [person,
    { '@type': 'WebSite', '@id': `${SITE.url}/#website`, url: `${SITE.url}/`, name: SITE.name, publisher: { '@id': person['@id'] }, inLanguage: 'en' },
    { '@type': page.kind, '@id': `${url}#webpage`, url, name: page.title, description: page.description,
      isPartOf: { '@id': `${SITE.url}/#website` }, inLanguage: 'en',
      ...(entityId ? { mainEntity: { '@id': entityId } } : {}),
      ...(page.path !== '/' ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
    },
  ];
  if (page.path !== '/') {
    const crumbs = [{ name: 'Home', item: `${SITE.url}/` },
      ...(page.post ? [{ name: 'Writing', item: canonical('/blog/') }] : []),
      { name: page.post?.title ?? page.product?.name ?? page.title.split(' — ')[0], item: url }];
    graph.push({ '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, ...c })) });
  }
  if (page.post) {
    const p = page.post;
    graph.push({ '@type': 'BlogPosting', '@id': entityId, headline: p.title, description: p.description,
      image: canonical(page.image), datePublished: p.publishDate.toISOString(), dateModified: (p.updatedDate ?? p.publishDate).toISOString(),
      author: { '@id': person['@id'] }, publisher: { '@id': person['@id'] },
      mainEntityOfPage: { '@id': `${url}#webpage` }, url, inLanguage: 'en', wordCount: p.wordCount,
      keywords: p.tags, isAccessibleForFree: true });
  }
  if (page.product) {
    const p = page.product;
    graph.push({ '@type': 'SoftwareApplication', '@id': entityId, name: p.name, alternateName: p.alternateNames,
      description: p.description, url, applicationCategory: p.category, operatingSystem: p.os,
      image: canonical(page.image), author: { '@id': person['@id'] },
      sameAs: [p.website, p.github].filter(Boolean), ...(p.github ? { codeRepository: p.github, downloadUrl: `${p.github}/releases` } : {}),
      featureList: p.features.map(f => `${f.title}: ${f.description}`),
      ...(p.license ? { license: `https://spdx.org/licenses/${p.license}.html` } : {}),
      ...(p.updatedDate ? { dateModified: p.updatedDate.toISOString() } : {}),
      ...(p.pricing === 'free' ? { isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: p.status === 'coming-soon' ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock' } } : {}),
    });
  }
  if (page.kind === 'CollectionPage' || page.path === '/') {
    const entries = page.path === '/blog/' ? posts.map(p => ({ name: p.title, url: canonical(`/blog/${p.id}/`) }))
      : page.path === '/' ? products.map(p => ({ name: p.name, url: canonical(`/${p.id}/`) })) : [];
    if (entries.length) graph.push({ '@type': 'ItemList', '@id': `${url}#items`, itemListElement: entries.map((p, i) => ({ '@type': 'ListItem', position: i + 1, ...p })) });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
