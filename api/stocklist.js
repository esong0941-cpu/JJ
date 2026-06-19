import https from 'https';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

function httpsPost(url, formData) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const body = new URLSearchParams(formData).toString();
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': UA,
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Referer': 'https://data.krx.co.kr/contents/MDC/STAT/standard/MDCSTAT01901.cmd',
        'Origin': 'https://data.krx.co.kr',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }, (res) => {
      let buf = '';
      res.on('data', c => (buf += c));
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('KRX timeout')); });
    req.write(body);
    req.end();
  });
}

// KRX sector name → unified sector label
const SECTOR_MAP = {
  '전기·전자': '반도체/전자',
  '전기,전자': '반도체/전자',
  '반도체': '반도체/전자',
  '의약품': '바이오/헬스케어',
  '의료·정밀기기': '바이오/헬스케어',
  '바이오': '바이오/헬스케어',
  '금융업': '금융/보험',
  '보험': '금융/보험',
  '증권': '금융/보험',
  '운수장비': '자동차/부품',
  '자동차': '자동차/부품',
  '화학': '에너지/화학',
  '석유·화학': '에너지/화학',
  '에너지': '에너지/화학',
  '철강금속': '철강/소재',
  '비금속광물': '철강/소재',
  '건설업': '건설/부동산',
  '음식료품': '소비재/유통',
  '섬유의복': '소비재/유통',
  '유통업': '소비재/유통',
  '소비재': '소비재/유통',
  '통신업': 'IT서비스/SW',
  '서비스업': 'IT서비스/SW',
  '소프트웨어': 'IT서비스/SW',
  '기계': '기계/방위',
  '조선': '기계/방위',
  '운수창고': '기계/방위',
  '전기가스업': '에너지/화학',
  '농업·임업·어업': '기타',
  '광업': '기타',
};

function mapSector(krxSector) {
  if (!krxSector) return '기타';
  for (const [key, val] of Object.entries(SECTOR_MAP)) {
    if (krxSector.includes(key) || key.includes(krxSector)) return val;
  }
  return krxSector || '기타';
}

async function fetchKRXMarket(mktId) {
  const { status, body } = await httpsPost(
    'https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd',
    { bld: 'dbms/MDC/STAT/standard/MDCSTAT01901', mktId, locale: 'ko_KR' }
  );
  if (status !== 200) throw new Error(`KRX HTTP ${status} for ${mktId}`);
  const json = JSON.parse(body);
  const rows = json.OutBlock_1 || json.block1 || [];
  return rows
    .filter(r => r.ISU_SRT_CD && r.ISU_SRT_CD.match(/^\d{6}$/))
    .map(r => ({
      code: r.ISU_SRT_CD,
      name: r.ISU_ABBRV || r.ISU_NM || r.ISU_SRT_CD,
      market: mktId === 'STK' ? 'KOSPI' : 'KOSDAQ',
      sector: mapSector(r.SECT_TP_NM || r.IDX_IND_NM || ''),
    }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400'); // 12h cache

  try {
    const [kospi, kosdaq] = await Promise.all([
      fetchKRXMarket('STK'),
      fetchKRXMarket('KSQ'),
    ]);

    const stocks = [...kospi, ...kosdaq];
    if (stocks.length < 100) throw new Error(`Too few stocks: ${stocks.length}`);

    console.log(`KRX: KOSPI ${kospi.length}, KOSDAQ ${kosdaq.length}`);
    res.json({ stocks, total: stocks.length, source: 'KRX', timestamp: Date.now() });
  } catch (err) {
    console.error('KRX fetch failed:', err.message);
    res.status(502).json({ error: err.message, stocks: [], total: 0 });
  }
}
