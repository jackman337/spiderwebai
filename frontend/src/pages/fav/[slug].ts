import { CookieKeys } from '@/lib/storage';
import type { APIRoute } from 'astro';

export const config = {
  runtime: 'edge',
};

export const get: APIRoute = async ({ request, cookies, params }) => {
  const auth = request.headers.get('authorization') ?? cookies?.get(CookieKeys.ACCESS_TOKEN)?.value;

  if (!auth) {
    return new Response('Authentication required', { status: 401 });
  }

  const res = await fetch(`https://www.google.com/s2/favicons?domain=${params.slug}&sz=${16}`);

  // TODO: get from storage if it fails from the resource and cache it

  return new Response(await res.arrayBuffer(), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=10',
      'CDN-Cache-Control': 'public, s-maxage=60',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
    },
  });
};
