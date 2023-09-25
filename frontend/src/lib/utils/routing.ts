const BASE_DOMAIN = import.meta.env.SITE;

export const routeParseAbsolute = (path?: string, lang?: string, r?: boolean) =>
  !lang
    ? `${BASE_DOMAIN}${path || ''}`
    : `${BASE_DOMAIN}${lang === 'en' && !r ? '' : `/${lang}`}${path || ''}`;
