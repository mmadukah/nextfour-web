import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Editable prose pages live as Markdown in src/content/legal/.
// Each file's name becomes its URL slug (privacy.md -> /privacy.html).
const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    // Text shown in the small line under the page heading
    // (e.g. "Last updated: 7 May 2026").
    meta: z.string(),
    // The page's search result snippet (meta description), 160 characters at most.
    description: z.string().max(160).optional(),
  }),
});

export const collections = { legal };
