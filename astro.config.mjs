import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://horacech.github.io',
  output: 'static',
  publicDir: './astro-public',
  cacheDir: '.astro/cache',
  vite: {
    cacheDir: '.astro/vite',
  },
});
