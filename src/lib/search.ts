export interface SearchEntry { title: string; description: string; url: string; kind: string; tags: string[] }
export function searchEntries(entries: SearchEntry[], query: string, kind = 'all') {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return entries.filter(entry => (kind === 'all' || entry.kind === kind)
    && terms.every(term => `${entry.title} ${entry.description} ${entry.tags.join(' ')}`.toLocaleLowerCase().includes(term)));
}
