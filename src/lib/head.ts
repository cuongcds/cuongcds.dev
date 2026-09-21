import { createHead } from 'unhead/server';
import { useSeoMeta } from 'unhead';
import { CanonicalPlugin } from 'unhead/plugins';
import { canonical, schemaFor, type PageData } from './page-data';
import { SITE } from '../site.config';

/** A fresh server instance per page prevents metadata leaking between routes. */
export function renderHead(page: PageData) {
  const head = createHead({ plugins: [CanonicalPlugin({ canonicalHost: SITE.url })] });
  useSeoMeta(head, {
    title: page.title, description: page.description, author: SITE.author,
    robots: page.noIndex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    ogTitle: page.title, ogDescription: page.description, ogType: page.post ? 'article' : 'website',
    ogUrl: canonical(page.path), ogSiteName: SITE.name, ogLocale: 'en_US',
    ogImage: canonical(page.image), ogImageWidth: 1200, ogImageHeight: 630, ogImageType: 'image/png', ogImageAlt: page.title,
    twitterCard: 'summary_large_image', twitterTitle: page.title, twitterDescription: page.description,
    twitterImage: canonical(page.image), twitterImageAlt: page.title, twitterCreator: `@${SITE.xHandle}`,
    ...(page.post ? { articlePublishedTime: page.post.publishDate.toISOString(), articleModifiedTime: (page.post.updatedDate ?? page.post.publishDate).toISOString(), articleAuthor: [`${SITE.url}/`], articleTag: page.post.tags } : {}),
  });
  head.push({
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#111722' },
      { name: 'color-scheme', content: 'light' },
      { name: 'generator', content: 'Astro' },
    ],
    link: [
      { rel: 'canonical', href: canonical(page.path) },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'manifest', href: '/site.webmanifest' },
      { rel: 'author', href: '/humans.txt' },
      { rel: 'alternate', type: 'application/rss+xml', title: `${SITE.author} — Writing`, href: '/rss.xml' },
      { rel: 'alternate', type: 'text/markdown', title: 'Site index for agents', href: '/llms.txt' },
      ...(page.post ? [{ rel: 'alternate' as const, type: 'text/markdown', title: 'Article Markdown', href: `/blog/${page.post.id}.md` }] : []),
    ],
    script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(schemaFor(page)).replace(/</g, '\\u003c'), key: 'schema' }],
  });
  return head.render().headTags;
}
