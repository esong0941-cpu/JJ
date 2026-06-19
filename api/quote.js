const https = require('https');

const STOCK_SYMBOLS = [
  '005930.KS', '000660.KS', '035420.KS', '051910.KS', '035720.KS',
  '207940.KS', '006400.KS', '028260.KS', '005490.KS', '105560.KS',
  '068270.KS', '003550.KS', '012330.KS', '096770.KS', '018260.KS', '000270.KS',
];

const INDEX_SYMBOLS = ['^KS11', '^KQ11', '^GSPC', '^IXIC', 'KRW=X'];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function getCrumb() {
  // Step 1: get cookies from fc.yahoo.com
  const cookieRes = await httpsGet('https://fc.yahoo.com', {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  });

  const setCookie = cookieRes.headers['set-cookie'] || [];
  const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');

  // Step 2: get crumb
  const crumbRes = await httpsGet('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    'User-Agent': UA,
    'Accept': '*/*',
    'Cookie': cookie,
  });

  if (!crumbRes.body || crumbRes.body.startsWith('{')) {
    throw new Error('crumb fetch failed: ' + crumbRes.body);
  }

  return { crumb: crumbRes.body.trim(), cookie };
}

async function fetchQuoteBatch(symbols, crumb, cookie) {
  const encoded = symbols.map(encodeURIComponent).join('%2C');
  const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encoded}&crumb=${encodeURIComponent(crumb)}&lang=en-US&region=US&corsDomain=finance.yahoo.com`;

  const res = await httpsGet(url, {
    'User-Agent': UA,
    'Accept': 'application/json',
    'Cookie': cookie,
    'Referer': 'https://finance.yahoo.com',
  });

  if (res.status !== 200) throw new Error(`quote HTTP ${res.status}`);
  const json = JSON.parse(res.body);
  return json?.quoteResponse?.result ?? [];
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=60');

  try {
    const { crumb, cookie } = await getCrumb();

    const allSymbols = [...STOCK_SYMBOLS, ...INDEX_SYMBOLS];
    const quotes = await fetchQuoteBatch(allSymbols, crumb, cookie);

    const indexSet = new Set(INDEX_SYMBOLS);
    const stocks = quotes.filter((q) => !indexSet.has(q.symbol));
    const indices = quotes.filter((q) => indexSet.has(q.symbol));

    res.json({ stocks, indices, timestamp: Date.now() });
  } catch (err) {
    console.error('quote error:', err.message);
    res.status(502).json({ error: err.message, stocks: [], indices: [] });
  }
};
