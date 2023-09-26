const target = {
  notFound: [404, 'Not Found'],
  ok: [200, 'Ok'],
  auth: [401, 'Authentication required'],
  rate: [429, 'Rate limit exceeded'],
  unmodified: [201, ''],
  error: [500, ''],
  // extend custom
  urlRequired: [400, 'URL not provided'],
};

type TargetKeys = keyof typeof target;
type Target = Record<TargetKeys, [number, string] | Response | unknown>;

const handler = {
  get(t: Target, prop: TargetKeys, _receiver?: Target) {
    const o = t[prop] as [number, string];
    return new Response(o[1] || null, { status: o[0] });
  },
};

export const resser = new Proxy(target, handler) as Record<TargetKeys, Response>;
