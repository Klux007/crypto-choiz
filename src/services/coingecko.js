const BASE_URL = 'https://api.coingecko.com/api/v3';
// CoinGecko caps per_page at 250 (see /coins/markets docs) — anything above
// requires paginating across multiple requests (extra API credits).
const MAX_PER_PAGE = 250;

// CoinGecko category ids for the 3 "named" filter buttons (All is not a
// named category — it represents every coin that isn't in any of these).
const CATEGORY_IDS = {
  meme: 'meme-token',
  ai: 'artificial-intelligence',
  rwa: 'real-world-assets-rwa',
};
const NAMED_KEYS = ['meme', 'ai', 'rwa'];

// Hardcoded list of major stablecoin ids, always excluded from every search
// (no user-facing toggle) — see notes techniques point 3. Filtered locally,
// no extra API call. Needs periodic/as-needed maintenance as new major
// stablecoins reach the high market-cap ranks.
const STABLECOIN_IDS = new Set([
  'tether',            // USDT
  'usd-coin',          // USDC
  'dai',               // DAI
  'ethena-usde',       // USDe
  'usds',              // USDS
  'paypal-usd',        // PYUSD
  'first-digital-usd', // FDUSD
  'true-usd',          // TUSD
  'paxos-standard',    // USDP
  'gemini-dollar',     // GUSD
  'euro-coin',         // EURC
]);

async function fetchMarketsPage({ apiKey, vsCurrency, category, perPage, page, priceChangePercentage }) {
  const params = new URLSearchParams({
    vs_currency: vsCurrency,
    order: 'market_cap_desc',
    per_page: String(perPage),
    page: String(page),
    sparkline: 'false',
    price_change_percentage: priceChangePercentage,
    x_cg_demo_api_key: apiKey,
  });
  if (category) params.set('category', category);

  const response = await fetch(`${BASE_URL}/coins/markets?${params}`);

  if (!response.ok) {
    throw new Error(`Erreur API CoinGecko : ${response.status}`);
  }

  return response.json();
}

// Fetches up to `total` coins ordered by market cap, splitting into several
// requests when total exceeds CoinGecko's 250-per-page limit.
async function fetchMarketsUpTo({ apiKey, vsCurrency, category, total, priceChangePercentage }) {
  const requests = [];
  let remaining = total;
  let page = 1;
  while (remaining > 0) {
    const perPage = Math.min(remaining, MAX_PER_PAGE);
    requests.push(fetchMarketsPage({ apiKey, vsCurrency, category, perPage, page, priceChangePercentage }));
    remaining -= perPage;
    page += 1;
  }
  const pages = await Promise.all(requests);
  return pages.flat();
}

// Fetches the id set of every coin CoinGecko lists under one category.
async function fetchCategoryIds({ apiKey, vsCurrency, categoryId, priceChangePercentage }) {
  const coins = await fetchMarketsPage({
    apiKey, vsCurrency, category: categoryId, perPage: MAX_PER_PAGE, page: 1, priceChangePercentage,
  });
  return new Set(coins.map(c => c.id));
}

// scope = { all, meme, ai, rwa } — non-exclusive toggles, at least one is
// always true (enforced by the Home screen UI).
//  - All acts as "the rest": every coin that isn't Meme/AI/RWA.
//  - A named button (Meme/AI/RWA) controls only its own category.
// Logic:
//  - All green  -> unrestricted, MINUS whichever named categories are red
//                  (a green named button adds nothing: it's already covered
//                  by All). k = number of red named categories.
//  - All red    -> ONLY the union of whichever named categories are green
//                  (at least one, since not all 4 can be red). k = number
//                  of green named categories.
// Category filtering ranks coins WITHIN the category, not within the overall
// market cap — so instead we always fetch the top-`universe` list by overall
// market cap, plus the id list of every "involved" named category (k extra
// calls), and cross-reference locally. Total calls = universe calls (1, or 2
// when universe = 400) + k.
export async function fetchMarketData({ apiKey, vsCurrency, universe, scope, priceChangePercentage }) {
  const { all } = scope;
  const involved = all
    ? NAMED_KEYS.filter(key => !scope[key]) // reds to exclude
    : NAMED_KEYS.filter(key => scope[key]); // greens to include (union)

  const [universeCoinsRaw, ...categorySets] = await Promise.all([
    fetchMarketsUpTo({ apiKey, vsCurrency, category: null, total: universe, priceChangePercentage }),
    ...involved.map(key => fetchCategoryIds({ apiKey, vsCurrency, categoryId: CATEGORY_IDS[key], priceChangePercentage })),
  ]);

  // Stablecoins are always excluded, regardless of scope (no extra API call).
  const universeCoins = universeCoinsRaw.filter(c => !STABLECOIN_IDS.has(c.id));

  if (involved.length === 0) {
    return universeCoins; // k = 0
  }

  return all
    ? universeCoins.filter(c => !categorySets.some(ids => ids.has(c.id))) // exclude the red categories
    : universeCoins.filter(c => categorySets.some(ids => ids.has(c.id))); // keep the union of green categories
}

// Returns the FULL sorted list of valid coins (not truncated to `count`) so
// the Results screen can paginate (page 1: ranks 1..count, page 2: ranks
// count+1..2*count) without any extra API call.
export function filterResults(coins, period, direction) {
  const fieldMap = {
    '1h':  'price_change_percentage_1h_in_currency',
    '24h': 'price_change_percentage_24h_in_currency',
    '7d':  'price_change_percentage_7d_in_currency',
  };
  const field = fieldMap[period];

  const valid = coins.filter(c => c[field] != null);

  return [...valid].sort((a, b) =>
    direction === 'winners'
      ? b[field] - a[field]
      : a[field] - b[field]
  );
}