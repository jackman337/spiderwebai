export const languages = {
  en: 'English',
  fr: 'Français',
};

export const defaultLang = 'en';

export type Translations = Record<keyof typeof languages, Record<string, string>>;

export const ui: Translations = {
  en: {
    'nav.home': 'Home',
    'nav.scrape': 'Scrape',
    'nav.pricing': 'Pricing',
    'nav.credits': 'Credits',
    'nav.chat': 'Chat',
  },
  fr: {
    'nav.home': 'Accueil',
    'nav.scrape': 'Scrape',
    'nav.pricing': 'Prix',
    'nav.credits': 'Crédits',
    'nav.chat': 'Chat',
  },
};

export const home: Translations = {
  en: {
    title: 'Spider - Scrape data fast with intelligence.',
    description: 'Collect data from any website with AI and ML abilities.',
    'intro.header': 'Scrape any website',
    'intro.details': 'Scrape any website and ask questions about the data.',
    'intro.subheader': 'Crawl your website',
  },
  fr: {
    title: 'Spider - Collectez rapidement des données avec intelligence.',
    description:
      "Le scraper doté de capacités d'IA le plus rapide pour extraire des données de n'importe quel site Web.",
    'intro.header': 'Scrapez n’importe quel site Web',
    'intro.details': 'Scrapez n’importe quel site Web et posez des questions sur vos données.',
    'intro.subheader': 'Scrapez votre site Web',
  },
};

export const pricing: Translations = {
  en: {
    title: 'Pricing',
    description: 'Simple and scalable. Only pay for what you use.',
    'intro.header': 'Features and Cost',
    'intro.description': 'Learn about the costs of credits per feature.',
  },
  fr: {
    title: 'Prix',
    description: 'Simple et évolutif. Payez seulement ce que vous utilisez..',
    'intro.header': 'Fonctionalités et prix',
    'intro.description': 'Renseignez-vous sur les coûts des crédits par fonctionalité.',
  },
};

export const about: Translations = {
  en: {
    title: 'About',
    description:
      'Learn about Spider and what the service provides to take your scraping game to the next level.',
    'intro.header': 'Spider Features',
    'intro.description':
      'Our features that facilitate website scraping and provide swift insights in one platform.',
    subheader: 'Fast Unblockable Scraping',
    'subheader-details':
      'When it comes to speed, the Spider project is the fastest web crawler available to the public. Utilize the foundation of open-source tools and make the most of your budget to scrape content effectively.',
    aiheader: 'Gain Website Insights with AI',
    'aiheader-details':
      'Enhance your crawls with AI to obtain relevant information fast from any website.',
    webhooksheader: 'Extract Data Using Webhooks',
    'webhooksheader-details':
      'Set up webhooks across your websites to deliver the desired information anywhere you need.',
  },
  fr: {
    title: 'About',
    description:
      'Learn about Spider and what the service provides to take your scraping game to the next level.',
    'intro.header': 'Spider Features',
    'intro.description':
      'Our features that facilitate website scraping and provide swift insights in one platform.',
    subheader: 'Fast Unblockable Data Scraping',
    'subheader-details':
      'When it comes to speed, the Spider project is the fastest web crawler available to the public. Utilize the foundation of open-source tools and make the most of your budget to scrape content effectively.',
    aiheader: 'Gain Website Insights with AI',
    'aiheader-details':
      'Enhance your crawls with AI to obtain relevant information fast from any website.',
    webhooksheader: 'Extract Data Using Webhooks',
    'webhooksheader-details':
      'Set up webhooks across your websites to deliver the desired information anywhere you need.',
  },
};

export const usage: Translations = {
  en: {
    title: 'Usage - Spider',
    description: 'Explore your usage and set limits that work with your budget.',
    'intro.header': 'Usage',
    'intro.description': `Below you'll find a summary of API usage for your account. The data may be delayed up to 5 minutes.`,
    'usage.limits': 'Usage limits',
    'approved.usage': 'Approved usage limit',
    'approved.description': 'The maximum usage Spider allows for your organization each month.',
    'hard.limit': 'Hard Limit',
    'hard.description':
      'When your organization reaches this usage threshold each month, subsequent requests will be rejected.',
  },
  fr: {
    title: 'Usage - Spider',
    description: 'Explore your usage and set limits that work with your budget.',
    'intro.header': 'Usage',
    'intro.description': `Below you'll find a summary of API usage for your account. The data may be delayed up to 5 minutes.`,
    'usage.limits': 'Usage limits',
    'approved.usage': 'Approved usage limit',
    'approved.description': 'The maximum usage Spider allows for your organization each month.',
    'hard.limit': 'Hard Limit',
    'hard.description':
      'When your organization reaches this usage threshold each month, subsequent requests will be rejected.',
  },
};

export const settings: Translations = {
  en: {
    title: 'Settings - Spider',
    description: 'Adjust your spider settings to adjust your crawl settings.',
    'intro.header': 'Spider Settings',
    'intro.description': `Determine how you want to crawl your pages. Advanced configurations that help you bring your data collecting game up.`,
    proxy: 'Proxy Adjustments',
    'proxy.description': 'Set a premium proxy to be used to prevent pages from being blocked.',
    headless: 'Headless Browser',
    'headless.description':
      'Use a headless browser to crawl websites that require Javascript to build.',
    webhooksheader: 'Extract Data Using Webhooks',
    'webhooksheader.description':
      'Set up webhooks across your websites to deliver the desired information anywhere you need.',
    'crawl.budget': 'Crawl Budget',
    'crawl.description':
      'Set a crawl budget to limit the amount of pages per domain. Use a wild card * to determine all routes.',
  },
  fr: {
    title: 'Settings - Spider',
    description: 'Adjust your spider settings to adjust your crawl settings.',
    'intro.header': 'Spider Settings',
    'intro.description': `Determine how you want to crawl your pages. Advanced configurations that help you bring your data collecting game up.`,
    proxy: 'Proxy Adjustments',
    'proxy.description': 'Set a premium proxy to be used to prevent pages from being blocked.',
    headless: 'Headless Browser',
    'headless.description':
      'Use a headless browser to crawl websites that require Javascript to build.',
    webhooksheader: 'Extract Data Using Webhooks',
    'webhooksheader.description':
      'Set up webhooks across your websites to deliver the desired information anywhere you need.',
    'crawl.budget': 'Crawl Budget',
    'crawl.description':
      'Set a crawl budget to limit the amount of pages per domain. Use a wild card * to determine all routes.',
  },
};

export const showDefaultLang = false;
