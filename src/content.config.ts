import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const cases = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/cases' }),
  schema: z.object({
    title: z.string(),
    // titleLines — необязательное переопределение для рендера h1 в виде нескольких строк.
    // title всё равно нужен: используется для <title> страницы, SEO и в превью-карточках.
    titleLines: z.array(z.string()).optional(),
    // brand — строка над заголовком кейса (раньше хардкод «марлиндев.ру»).
    brand: z.string().default('марлиндев.ру'),
    subtitle: z.string().optional(),
    client: z.string().optional(),
    year: z.number(),
    role: z.string(),
    services: z.array(z.string()).default([]),
    stack: z.array(z.string()).default([]),
    cover: z.string().optional(),
    coverFit: z.enum(['cover', 'contain']).default('cover'),
    coverAspect: z.string().optional(),
    coverType: z.enum(['browser', 'device']).default('browser'),
    screens: z.array(z.string()).optional(),
    gallery: z.array(z.string()).optional(),
    summary: z.string(),
    links: z
      .object({
        live: z.string().url().optional(),
        repo: z.string().url().optional(),
      })
      .optional(),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

export const collections = { cases };
