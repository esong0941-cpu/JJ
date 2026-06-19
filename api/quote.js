import https from 'https';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const STOCK_SYMBOLS = [
  '005930.KS', '000660.KS', '035420.KS', '051910.KS', '035720.KS',
  '207940.KS', '006400.KS', '028260.KS', '005490.KS', '105560.KS',
  '068270.KS', '003550.KS', '012330.KS', '096770.KS', '018260.KS', '000270.KS',
];

const INDEX_SYMBOLS = ['^KS11', '^KQ11', '^GSPC', '^IXIC', 'KRW=X'];

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'application/json, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://finance.yahoo.com/',
      },
    }, (res) => {
      let body = '';
      res.on('data', c => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.setTimeout(9000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function fetchSymbol(symbol) {
  const encoded = encodeURIComponent(symbol);
  const { status, body } = await get(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?range=1d&interval=1m&includePrePost=false`
  );

  if (status !== 200) throw new Error(`HTTP ${status}`);

  const json = JSON.parse(body);
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) throw new Error('no price data');

  return {
    symbol,
    shortName: meta.shortName || meta.longName || symbol,
    regularMarketPrice: meta.regularMarketPrice,
    regularMarketChange: meta.regularMarketChange || 0,
    regularMarketChangePercent: meta.regularMarketChangePercent || 0,
    regularMarketVolume: meta.regularMarketVolume || 0,
    marketCap: meta.marketCap || 0,
    trailingPE: meta.trailingPE || null,
    priceToBook: meta.priceToBook || null,
    trailingAnnualDividendYield: meta.trailingAnnualDividendYield || null,
    marketState: meta.marketState || 'CLOSED',
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=60');

  const allSymbols = [...STOCK_SYMBOLS, ...INDEX_SYMBOLS];
  const results = await Promise.allSettled(allSymbols.map(fetchSymbol));

  const indexSet = new Set(INDEX_SYMBOLS);
  const stocks = [];
  const indices = [];

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      if (indexSet.has(allSymbols[i])) indices.push(r.value);
      else stocks.push(r.value);
    } else {
      console.warn(`SKIP ${allSymbols[i]}: ${r.reason?.message}`);
    }
  });

  if (stocks.length === 0) {
    return res.status(502).json({ error: 'All stock fetches failed', stocks: [], indices: [] });
  }

  res.json({ stocks, indices, timestamp: Date.now() });
}
