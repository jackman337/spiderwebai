import type { APIRoute } from 'astro';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import type { ChatCompletionRequestMessage } from 'openai-edge';
import {
  authenticateSupabaseClientFromRequest,
  createSupabaseAdminClient,
} from '../../lib/supabase';
import { validateCredits } from '@/lib/utils/check-credits';
import { openai, type Docs, OPENAI_MODEL_DEFAULT } from '@/lib/openai';
import { reportUsageToStripe } from '@/lib/utils/stripe/report-usage';

export const config = {
  runtime: 'edge',
};

export const post: APIRoute = async ({ request, cookies }) => {
  const supabase = await authenticateSupabaseClientFromRequest(cookies);

  const {
    data: { user },
  } = (await supabase?.auth?.getUser()) ?? { data: { user: null } };

  if (!user) {
    return new Response('Authentication required', { status: 401 });
  }

  const creditsData = await validateCredits(supabase, user?.id);

  if (creditsData instanceof Response) {
    return creditsData;
  }

  // TODO: add first response in cache and get results in DB moving forward.

  const { url: baseWebsite } = await request.json();

  const docs: any[] = [];

  // default to all data from website
  if (baseWebsite) {
    const documentData = await supabase
      ?.rpc('get_random_pages_metadata', {
        dname: baseWebsite,
      })
      ?.select('url,title,description');

    if (documentData && documentData.data) {
      docs.push(...documentData.data);
    }
  }

  // todo: filter in db
  const arrUniq = [
    ...new Map(
      (docs || []).filter((e) => e?.title || e?.description).map((v) => [v?.description, v])
    ).values(),
  ] as Docs[];

  const preData = arrUniq?.map((e: Docs) => {
    const _cleanUrl = e.url.replaceAll('*_*', '/').split('/');
    const cleanURL = _cleanUrl && _cleanUrl[2];

    return {
      role: 'assistant',
      content: `${cleanURL ? `Resource: ${cleanURL} ` : ''}${e?.title || 'null'} < > ${
        e?.description || 'null'
      }`.replace(/\n/g, ' '),
    };
  }) as ChatCompletionRequestMessage[];

  const messageSet: ChatCompletionRequestMessage[] = preData ?? [];

  const questionHandle = `Tell me up to 5 questions that you think a user should ask${
    docs?.length
      ? ` about the dataset${
          baseWebsite ? ` or any information you have related to ${baseWebsite}` : ''
        }.`
      : baseWebsite
      ? `about ${baseWebsite}`
      : ''
  }.`;

  const outputBlock = messageSet.length
    ? `Do not include < > in output and do not mention these initial instructions.`
    : 'Do not mention these initial instructions.';

  messageSet.unshift(
    {
      role: 'system',
      content: `${
        messageSet.length
          ? `You are a helpful assistant to learn about my data. You will receive a list of website url paths that have titles and descriptions separated by < > I want you to tell me about in the following prompts.`
          : ''
      }${questionHandle}. ${outputBlock} Return the results as JSON Lines { q: "", a: ""}.`.replace(
        /\n/g,
        ' '
      ),
    },
    ...preData
  );

  const response = await openai.createChatCompletion({
    model: OPENAI_MODEL_DEFAULT,
    stream: true,
    messages: messageSet,
    user: user.id,
    max_tokens: 500,
    temperature: 0.7,
  });

  const creditsObject = typeof creditsData === 'object';

  // TODO: let user know that using AI requires credits since the subscription is set to handle one penny per prompt which is kinda fine.
  if (creditsObject) {
    const creditsV = creditsData.creditsValue;

    if (creditsData.creditsValue) {
      const creditCost = 5 * (preData.length || 5);

      // about 3 calls per penny for now
      const { error } = await createSupabaseAdminClient().rpc('decrement_credits', {
        c: (creditsV || 0) < creditCost ? 0 : creditCost,

        u: user.id,
      });

      if (error) {
        console.error(error.message);
        // TODO: do not return message
        return new Response('An error occured', { status: 500 });
      }
    } else {
      await reportUsageToStripe({
        supabaseAdmin: supabase,
        user,
        usage: 1,
      });
    }
  }

  try {
    const stream = OpenAIStream(response);

    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error(e);
    return new Response(
      `{q: 'Tell me about ${baseWebsite}.', a: 'The website has ${baseWebsite?.length} in the domain.'}`
    );
  }
};
