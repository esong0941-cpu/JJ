const https = require('https');

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
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function getDays(range) {
  return { '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365 }[range] || 180;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const { symbol, range = '6mo' } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  const now = Math.floor(Date.now() / 1000);
  const period1 = now - getDays(range) * 86400;
  const encoded = encodeURIComponent(symbol);

  try {
    const { status, body } = await get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?period1=${period1}&period2=${now}&interval=1d&includePrePost=false`
    );

    if (status !== 200) throw new Error(`HTTP ${status}`);

    const json = JSON.parse(body);
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error('no chart result');

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const volumes = result.indicators?.quote?.[0]?.volume || [];

    const history = timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        price: closes[i] != null ? Math.round(closes[i]) : null,
        volume: volumes[i] || 0,
      }))
      .filter(d => d.price != null);

    res.json({ symbol, history });
  } catch (err) {
    console.error('history error:', err.message);
    res.status(502).json({ error: err.message, history: [] });
  }
};
