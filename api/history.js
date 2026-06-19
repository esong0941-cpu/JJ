const https = require('https');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function getCrumb() {
  const cookieRes = await httpsGet('https://fc.yahoo.com', {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  });

  const setCookie = cookieRes.headers['set-cookie'] || [];
  const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');

  const crumbRes = await httpsGet('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    'User-Agent': UA,
    'Accept': '*/*',
    'Cookie': cookie,
  });

  if (!crumbRes.body || crumbRes.body.startsWith('{')) {
    throw new Error('crumb fetch failed');
  }

  return { crumb: crumbRes.body.trim(), cookie };
}

function getTimestamps(range) {
  const now = Math.floor(Date.now() / 1000);
  const days = { '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365 };
  const period1 = now - (days[range] || 180) * 86400;
  return { period1, period2: now };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const { symbol, range = '6mo' } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol parameter required' });

  try {
    const { crumb, cookie } = await getCrumb();
    const { period1, period2 } = getTimestamps(range);

    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=1d&crumb=${encodeURIComponent(crumb)}`;

    const chartRes = await httpsGet(url, {
      'User-Agent': UA,
      'Accept': 'application/json',
      'Cookie': cookie,
      'Referer': 'https://finance.yahoo.com',
    });

    if (chartRes.status !== 200) throw new Error(`chart HTTP ${chartRes.status}`);

    const json = JSON.parse(chartRes.body);
    const result = json?.chart?.result?.[0];

    if (!result) throw new Error('no chart data');

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const volumes = result.indicators?.quote?.[0]?.volume || [];

    const history = timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        price: closes[i] != null ? Math.round(closes[i]) : null,
        volume: volumes[i] || 0,
      }))
      .filter((d) => d.price != null);

    res.json({ symbol, history });
  } catch (err) {
    console.error('history error:', err.message);
    res.status(502).json({ error: err.message, history: [] });
  }
};
