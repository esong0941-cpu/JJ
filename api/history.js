const https = require('https');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

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
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function getDays(range) {
  return { '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365 }[range] || 180;
}

async function fetchYahooChart(symbol, range) {
  const now = Math.floor(Date.now() / 1000);
  const period1 = now - getDays(range) * 86400;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${now}&interval=1d&lang=en-US`;

  const res = await httpsGet(url, {
    'User-Agent': UA,
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
  });

  if (res.status !== 200) throw new Error(`Yahoo chart HTTP ${res.status}`);
  const json = JSON.parse(res.body);
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error('no chart data');

  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  const volumes = result.indicators?.quote?.[0]?.volume || [];

  return timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      price: closes[i] != null ? Math.round(closes[i]) : null,
      volume: volumes[i] || 0,
    }))
    .filter(d => d.price != null);
}

async function fetchNaverHistory(code, range) {
  const days = getDays(range);
  const end = new Date();
  const start = new Date(Date.now() - days * 86400 * 1000);

  const fmt = d => d.toISOString().split('T')[0].replace(/-/g, '');
  const url = `https://fchart.stock.naver.com/siseJson.nhn?symbol=${code}&requestType=1&startTime=${fmt(start)}&endTime=${fmt(end)}&timeframe=day`;

  const res = await httpsGet(url, {
    'User-Agent': UA,
    'Accept': '*/*',
    'Referer': 'https://finance.naver.com/',
  });

  if (res.status !== 200) throw new Error(`Naver chart HTTP ${res.status}`);

  // Response is JS array-like: [["날짜","시가","고가","저가","종가","거래량"],...]
  const text = res.body.trim();
  const rows = JSON.parse(text.replace(/\n/g, ''));

  return rows
    .filter(r => Array.isArray(r) && r.length >= 6 && r[0])
    .map(r => {
      const dateStr = String(r[0]).trim();
      return {
        date: `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`,
        price: parseInt(String(r[4]).replace(/,/g, ''), 10) || 0,
        volume: parseInt(String(r[5]).replace(/,/g, ''), 10) || 0,
      };
    })
    .filter(d => d.price > 0);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const { symbol, range = '6mo' } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol parameter required' });

  // Derive Naver code from symbol (e.g. "005930.KS" -> "005930")
  const naverCode = symbol.replace(/\.(KS|KQ)$/i, '');
  const isKorean = /^\d{6}$/.test(naverCode);

  try {
    let history;

    if (isKorean) {
      // Try Naver first for Korean stocks (more reliable)
      try {
        history = await fetchNaverHistory(naverCode, range);
      } catch (e) {
        console.warn('Naver history failed, trying Yahoo:', e.message);
        history = await fetchYahooChart(symbol, range);
      }
    } else {
      history = await fetchYahooChart(symbol, range);
    }

    res.json({ symbol, history });
  } catch (err) {
    console.error('history error:', err.message);
    res.status(502).json({ error: err.message, history: [] });
  }
};
