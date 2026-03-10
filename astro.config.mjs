// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://happyhaha.github.io',
  base: '/solar-series',
  vite: {
    plugins: [tailwindcss()]
  }
});