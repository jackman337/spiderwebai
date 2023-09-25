import { defineConfig } from "astro/config";
import vercel from '@astrojs/vercel/edge';
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

// todo: pass in envs
const site = import.meta.env.DEV ? "http://localhost:3000" : 'https://spiderwebai.xyz';

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: true
    }), 
    sitemap({
      filter: (page) => !page.startsWith(`${site}/account`) && page !== `${page}/credits/cancel` && page !== `${page}/credits/success` && page !== `${page}/fav/[slug]` && !page.startsWith(`${page}/fav/`),
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US', 
          fr: 'fr-CA',
        },
      },
    }),
  ],
  output: "server",
  adapter: vercel({
    // analytics: true,
  })
});