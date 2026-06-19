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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=60');

  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  try {
    const encoded = encodeURIComponent(symbol);
    const { status, body } = await get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?range=1d&interval=1m&includePrePost=false`
    );
    if (status !== 200) throw new Error(`HTTP ${status}`);

    const json = JSON.parse(body);
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) throw new Error('no price data');

    res.json({
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
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || null,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || null,
      currency: meta.currency || 'KRW',
      exchangeName: meta.exchangeName || '',
    });
  } catch (err) {
    console.error('stock error:', err.message);
    res.status(502).json({ error: err.message });
  }
}
