const DEFAULT_SETTINGS: Record<string, string> = {
  site_currency_symbol: '₦',
  site_global_currency: 'NGN',
  site_title: 'QwikConnect - Service Marketplace',
};

export async function getStaticOption(
  optionName: string,
  fallback: string = ''
): Promise<string> {
  return DEFAULT_SETTINGS[optionName] ?? fallback;
}

export async function getStaticOptions(
  optionNames: string[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const name of optionNames) {
    if (DEFAULT_SETTINGS[name]) {
      result[name] = DEFAULT_SETTINGS[name];
    }
  }
  return result;
}
