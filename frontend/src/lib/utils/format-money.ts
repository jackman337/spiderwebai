export const moneyFormater = (lang?: string, noconf?: Intl.NumberFormatOptions) => {
  const pConfig = noconf ?? {
    style: 'currency',
    currency: 'USD',
  };

  try {
    return new Intl.NumberFormat(lang, pConfig);
  } catch (e) {
    return new Intl.NumberFormat('en', pConfig);
  }
};

export const formatMoney = (lang?: string, total?: number, noconf?: Intl.NumberFormatOptions) =>
  moneyFormater(lang, noconf).format(total ?? 0);
