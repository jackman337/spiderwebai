import type { APIRoute } from 'astro';
import {
  authenticateSupabaseClientFromRequest,
  createSupabaseAdminClient,
} from '../../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// paginated delete websites recursively
const pagingDelete = async (p: {
  storageBasePath: string;
  supabaseAdmin: SupabaseClient;
  limit: number;
  nextPage: number;
}) => {
  const { supabaseAdmin, storageBasePath, limit, nextPage } = p;
  const { data: list } = await supabaseAdmin.storage
    .from('resource')
    .list(storageBasePath, { limit, offset: !nextPage ? 0 : limit * (nextPage + 1) });

  const storageList = list?.map((x) => `${storageBasePath}/${x.name}`) || [];

  const preventRecursive = storageList.length < limit;

  storageList.push(storageBasePath);

  // TODO: display deleting tooltip at the top of the browser or move to SSR
  const { error: eer } = await supabaseAdmin.storage.from('resource').remove(storageList);

  if (eer) {
    console.error(eer);
  }

  // re-run the paging files
  if (!preventRecursive) {
    await pagingDelete({
      ...p,
      nextPage: nextPage + 1,
    });
  }
};

/**
 * ALL Routes
 * DELETE delete website data
 */
export const all: APIRoute = async ({ request, cookies }) => {
  const supabase = await authenticateSupabaseClientFromRequest(cookies, request.headers);
  const {
    data: { user },
  } = (await supabase?.auth?.getUser()) ?? { data: { user: null } };

  if (!user) {
    return new Response('Authentication required', { status: 401 });
  }

  const { id, domain } = await request.json();

  // retrieve user profile
  const supabaseAdmin = createSupabaseAdminClient();

  if (request.method === 'DELETE') {
    const { error } = await supabaseAdmin
      .from('websites')
      .delete()
      .eq('user_id', user.id)
      .eq('id', id);

    if (error) {
      return new Response(null, { status: 500 });
    } else {
      try {
        const storageBasePath = `${user.id}/${domain}`;

        await pagingDelete({
          supabaseAdmin,
          storageBasePath,
          limit: 200,
          nextPage: 0,
        });
      } catch (e) {
        console.error(e);
      }
    }
  }

  return new Response(null, { status: 201 });
};
