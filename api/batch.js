import https from 'https';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

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
  if (!meta?.regularMarketPrice) throw new Error('no price');
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
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');

  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });

  const list = symbols.split(',').filter(Boolean).slice(0, 50);

  const results = await Promise.allSettled(list.map(fetchSymbol));

  const quotes = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  const failed = results.filter(r => r.status === 'rejected').length;
  if (failed > 0) console.warn(`${failed}/${list.length} batch fetches failed`);

  res.json({ quotes, timestamp: Date.now() });
}
