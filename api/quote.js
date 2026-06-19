const yahooFinance = require('yahoo-finance2').default;

yahooFinance.suppressNotices(['yahooSurvey']);

const STOCK_SYMBOLS = [
  '005930.KS', '000660.KS', '035420.KS', '051910.KS', '035720.KS',
  '207940.KS', '006400.KS', '028260.KS', '005490.KS', '105560.KS',
  '068270.KS', '003550.KS', '012330.KS', '096770.KS', '018260.KS', '000270.KS',
];

const INDEX_SYMBOLS = ['^KS11', '^KQ11', '^GSPC', '^IXIC', 'KRW=X'];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=60');

  try {
    const [stockQuotes, indexQuotes] = await Promise.all([
      yahooFinance.quote(STOCK_SYMBOLS, {}, { validateResult: false }),
      yahooFinance.quote(INDEX_SYMBOLS, {}, { validateResult: false }),
    ]);

    const normalize = (q) => (Array.isArray(q) ? q : [q]);

    res.json({
      stocks: normalize(stockQuotes),
      indices: normalize(indexQuotes),
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('quote error:', err.message);
    res.status(502).json({ error: err.message, stocks: [], indices: [] });
  }
};
