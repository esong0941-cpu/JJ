const https = require('https');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const STOCK_CODES = [
  '005930', '000660', '035420', '051910', '035720',
  '207940', '006400', '028260', '005490', '105560',
  '068270', '003550', '012330', '096770', '018260', '000270',
];

const INDEX_SYMBOLS = ['^KS11', '^KQ11', '^GSPC', '^IXIC', 'KRW=X'];

function httpsGet(url, headers = {}, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    const req = https.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        const cookies = (res.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
        const merged = [headers['Cookie'], cookies].filter(Boolean).join('; ');
        return resolve(httpsGet(next, { ...headers, Cookie: merged }, redirects + 1));
      }
      let body = '';
      res.on('data', c => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.setTimeout(9000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

const parseNum = s => parseFloat(String(s ?? '0').replace(/,/g, '')) || 0;
const parseInt2 = s => parseInt(String(s ?? '0').replace(/,/g, ''), 10) || 0;

async function fetchNaverStock(code) {
  const res = await httpsGet(
    `https://m.stock.naver.com/api/stock/${code}/basic`,
    { 'User-Agent': UA, 'Accept': 'application/json', 'Referer': 'https://m.stock.naver.com/' }
  );
  if (res.status !== 200) throw new Error(`Naver ${code}: HTTP ${res.status}`);
  const d = JSON.parse(res.body);

  const price = parseNum(d.closePrice);
  const change = parseNum(d.compareToPreviousClosePrice);
  const changeRate = parseNum(d.fluctuationsRatio);
  const volume = parseInt2(d.accumulatedTradingVolume);
  // marketValue from Naver is in 억원 (100 million KRW)
  const marketCapAk = parseNum(d.marketValue);

  return {
    symbol: `${code}.KS`,
    shortName: d.stockName || code,
    regularMarketPrice: price,
    regularMarketChange: change,
    regularMarketChangePercent: changeRate,
    regularMarketVolume: volume,
    marketCap: Math.round(marketCapAk * 1e8),
    trailingPE: parseNum(d.per) || undefined,
    priceToBook: parseNum(d.pbr) || undefined,
    trailingAnnualDividendYield: parseNum(d.dividendYield) / 100 || undefined,
    marketState: 'CLOSED',
  };
}

async function fetchYahooIndices() {
  const joined = INDEX_SYMBOLS.map(encodeURIComponent).join(',');

  // Try without crumb first
  try {
    const res = await httpsGet(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${joined}&lang=en-US&region=US`,
      { 'User-Agent': UA, 'Accept': 'application/json', 'Accept-Language': 'en-US,en;q=0.9' }
    );
    if (res.status === 200) {
      const json = JSON.parse(res.body);
      const results = json?.quoteResponse?.result;
      if (results?.length) return results;
    }
  } catch (_) { /* fall through to crumb method */ }

  // Try with crumb
  const cookieRes = await httpsGet('https://fc.yahoo.com', {
    'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.5',
  });
  const cookies = (cookieRes.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');

  const crumbRes = await httpsGet('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    'User-Agent': UA, 'Accept': '*/*', 'Cookie': cookies,
  });
  const crumb = crumbRes.body.trim();
  if (!crumb || crumb.length > 20 || crumb.includes('<')) throw new Error('bad crumb');

  const res2 = await httpsGet(
    `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${joined}&crumb=${encodeURIComponent(crumb)}&lang=en-US&region=US`,
    { 'User-Agent': UA, 'Accept': 'application/json', 'Cookie': cookies }
  );
  if (res2.status !== 200) throw new Error(`Yahoo v7 HTTP ${res2.status}`);
  const json = JSON.parse(res2.body);
  return json?.quoteResponse?.result ?? [];
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=60');

  try {
    const [stockResults, indices] = await Promise.all([
      Promise.allSettled(STOCK_CODES.map(fetchNaverStock)),
      fetchYahooIndices().catch(e => { console.error('indices error:', e.message); return []; }),
    ]);

    const stocks = stockResults
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    const failed = stockResults.filter(r => r.status === 'rejected').length;
    if (failed) console.warn(`${failed}/${STOCK_CODES.length} stock fetches failed`);

    res.json({ stocks, indices, timestamp: Date.now() });
  } catch (err) {
    console.error('quote handler error:', err.message);
    res.status(502).json({ error: err.message, stocks: [], indices: [] });
  }
};
