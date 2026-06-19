const yahooFinance = require('yahoo-finance2').default;

yahooFinance.suppressNotices(['yahooSurvey']);

function getStartDate(range) {
  const d = new Date();
  const days = { '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365 };
  d.setDate(d.getDate() - (days[range] || 180));
  return d.toISOString().split('T')[0];
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const { symbol, range = '6mo' } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol parameter required' });

  try {
    const result = await yahooFinance.historical(
      symbol,
      { period1: getStartDate(range), interval: '1d' },
      { validateResult: false }
    );

    const history = result.map((d) => ({
      date: d.date.toISOString().split('T')[0],
      price: Math.round(d.close),
      volume: d.volume || 0,
    }));

    res.json({ symbol, history });
  } catch (err) {
    console.error('history error:', err.message);
    res.status(502).json({ error: err.message, history: [] });
  }
};
