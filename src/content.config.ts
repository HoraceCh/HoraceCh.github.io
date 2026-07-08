import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: z.string(),
    subcategory: z.string().optional(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['seed', 'growing', 'evergreen', 'archived']).default('seed'),
    type: z
      .enum([
        'paper-reading',
        'concept-note',
        'project-log',
        'learning-note',
        'engineering-note',
        'workflow-note',
      ])
      .default('learning-note'),
    sourcePath: z.string().optional(),
    collection: z.string().optional(),
    modulePath: z.array(z.string()).default([]),
    module: z.string().optional(),
    isIndex: z.boolean().default(false),
    noteRole: z
      .enum([
        'collection-index',
        'module-index',
        'learning-note',
        'concept-note',
        'project-log',
        'paper-reading',
        'workflow-note',
      ])
      .default('learning-note'),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    path: z.string().optional(),
    order: z.number().optional(),
    level: z.enum(['foundation', 'intermediate', 'advanced']).optional(),
    related: z.array(z.string()).default([]),
    prerequisites: z.array(z.string()).default([]),
    concepts: z.array(z.string()).default([]),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    status: z.enum(['planned', 'in-progress', 'completed', 'archived']).default('planned'),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    links: z
      .object({
        github: z.string().url().optional(),
        demo: z.string().url().optional(),
        notes: z.string().optional(),
      })
      .default({}),
  }),
});

export const collections = { notes, projects };
