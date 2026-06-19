import https from 'https';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': UA, 'Accept': 'application/json', 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' },
    }, (res) => {
      let body = '';
      res.on('data', c => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60');

  const { q } = req.query;
  if (!q || q.trim().length < 1) return res.json({ results: [] });

  try {
    const { status, body } = await get(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&lang=ko-KR&region=KR&quotesCount=20&newsCount=0&listsCount=0&enableFuzzyQuery=false`
    );
    if (status !== 200) throw new Error(`HTTP ${status}`);

    const json = JSON.parse(body);
    const results = (json?.quotes || [])
      .filter(item => item.quoteType === 'EQUITY' && item.symbol)
      .map(item => ({
        symbol: item.symbol,
        shortname: item.shortname || item.longname || item.symbol,
        exchDisp: item.exchDisp || item.exchange || '',
        sector: item.sector || '',
        isKorean: item.exchange === 'KSC' || item.exchange === 'KOE' || item.symbol?.endsWith('.KS') || item.symbol?.endsWith('.KQ'),
      }))
      .sort((a, b) => (b.isKorean ? 1 : 0) - (a.isKorean ? 1 : 0));

    res.json({ results });
  } catch (err) {
    console.error('search error:', err.message);
    res.status(502).json({ error: err.message, results: [] });
  }
}
