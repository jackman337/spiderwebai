import { defaultLang, home, pricing, showDefaultLang, ui, about, usage, settings } from './ui';

type Language = keyof typeof ui | keyof typeof home | keyof typeof about;
type DicType = typeof home | typeof ui | typeof about;

const sources = { home, ui, pricing, about, usage, settings };

export function getLangFromUrl(url: URL, source: keyof typeof sources = 'ui') {
  const [, lang] = url.pathname.split('/');
  const base = sources[source];

  if (lang in base) {
    return lang as keyof typeof base;
  }

  return defaultLang;
}

export function getTranslations<K extends DicType[Language]>(
  lang: Language,
  source: keyof typeof sources
) {
  const base = sources[source];
  type BaseKey = (typeof base)[Language];

  return function t(key: keyof K | keyof BaseKey) {
    return base[lang in base ? lang : defaultLang][key as keyof BaseKey];
  };
}

export function getTranslatedPath(lang: keyof typeof ui) {
  return function translatePath(path: string, l: string = lang) {
    return !showDefaultLang && l === defaultLang ? path : `/${l}${path}`;
  };
}
