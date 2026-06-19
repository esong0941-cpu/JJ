export interface CompanyMeta {
  code: string;
  yahooSymbol: string;
  name: string;
  sector: string;
  market: 'KOSPI' | 'KOSDAQ';
  ceo: string;
  founded: string;
  employees: number;
  description: string;
  shortReason: string;
  longReason: string;
  targetMultiplier: number;
  stopLossMultiplier: number;
  roe: number;
  debtRatio: number;
  dividendYield: number;
  revenueGrowth: number;
  operatingMargin: number;
  revenue: number;
  operatingProfit: number;
  netProfit: number;
  financialHistory: { year: string; revenue: number; operatingProfit: number; netProfit: number; eps: number }[];
  analystRatings: { strongBuy: number; buy: number; hold: number; sell: number; upsideTarget: number };
}

export const COMPANY_META: Record<string, CompanyMeta> = {
  '005930': {
    code: '005930', yahooSymbol: '005930.KS', name: '삼성전자',
    sector: '반도체', market: 'KOSPI', ceo: '한종희', founded: '1969년', employees: 270372,
    description: '세계 최대 메모리 반도체 및 디스플레이 제조업체. HBM을 중심으로 AI 반도체 시장에서 핵심 역할.',
    shortReason: 'RSI 과매도 구간 진입, 볼린저밴드 하단 지지, MACD 골든크로스 임박',
    longReason: 'AI 반도체 수요 확대로 HBM 수혜, D램·낸드 업사이클, 파운드리 회복 기대',
    targetMultiplier: 1.10, stopLossMultiplier: 0.96,
    roe: 12.8, debtRatio: 28.4, dividendYield: 2.34, revenueGrowth: 18.5, operatingMargin: 22.3,
    revenue: 300_870_000_000_000, operatingProfit: 32_726_000_000_000, netProfit: 26_082_000_000_000,
    financialHistory: [
      { year: '2021', revenue: 279_600_000_000_000, operatingProfit: 51_634_000_000_000, netProfit: 39_907_000_000_000, eps: 5777 },
      { year: '2022', revenue: 302_231_000_000_000, operatingProfit: 43_376_000_000_000, netProfit: 34_484_000_000_000, eps: 5020 },
      { year: '2023', revenue: 258_935_000_000_000, operatingProfit: 6_567_000_000_000, netProfit: 14_489_000_000_000, eps: 2131 },
      { year: '2024', revenue: 300_870_000_000_000, operatingProfit: 32_726_000_000_000, netProfit: 26_082_000_000_000, eps: 3869 },
    ],
    analystRatings: { strongBuy: 24, buy: 8, hold: 3, sell: 0, upsideTarget: 1.27 },
  },
  '000660': {
    code: '000660', yahooSymbol: '000660.KS', name: 'SK하이닉스',
    sector: '반도체', market: 'KOSPI', ceo: '곽노정', founded: '1983년', employees: 30000,
    description: '세계 2위 메모리 반도체 업체. HBM 분야 세계 1위, AI 반도체 붐의 최대 수혜주.',
    shortReason: 'AI 반도체 수요 급증, HBM 공급 확대, 실적 상향 기대',
    longReason: 'HBM3E 독점 공급, AI 서버 수요 폭발, 메모리 반도체 슈퍼사이클 진입',
    targetMultiplier: 1.12, stopLossMultiplier: 0.965,
    roe: 24.7, debtRatio: 42.1, dividendYield: 0.98, revenueGrowth: 68.4, operatingMargin: 38.2,
    revenue: 66_195_000_000_000, operatingProfit: 23_462_000_000_000, netProfit: 19_779_000_000_000,
    financialHistory: [
      { year: '2021', revenue: 42_998_000_000_000, operatingProfit: 12_410_000_000_000, netProfit: 9_628_000_000_000, eps: 13202 },
      { year: '2022', revenue: 44_649_000_000_000, operatingProfit: 7_002_000_000_000, netProfit: 2_741_000_000_000, eps: 3761 },
      { year: '2023', revenue: 32_766_000_000_000, operatingProfit: -7_733_000_000_000, netProfit: -7_732_000_000_000, eps: -10591 },
      { year: '2024', revenue: 66_195_000_000_000, operatingProfit: 23_462_000_000_000, netProfit: 19_779_000_000_000, eps: 27124 },
    ],
    analystRatings: { strongBuy: 30, buy: 5, hold: 1, sell: 0, upsideTarget: 1.28 },
  },
  '207940': {
    code: '207940', yahooSymbol: '207940.KS', name: '삼성바이오로직스',
    sector: '바이오', market: 'KOSPI', ceo: '존 림', founded: '2011년', employees: 7500,
    description: '세계 최대 바이오의약품 위탁생산(CMO) 기업. 5개 공장 운영, 총 생산능력 세계 1위.',
    shortReason: 'CDO 수주 급증, 글로벌 바이오 CMO 1위 굳건, 실적 가이던스 상향',
    longReason: '글로벌 CMO 수주 잔고 13조원 돌파, 5공장 완공 시 실적 레버리지 극대화',
    targetMultiplier: 1.09, stopLossMultiplier: 0.97,
    roe: 15.4, debtRatio: 18.9, dividendYield: 0.0, revenueGrowth: 24.8, operatingMargin: 31.6,
    revenue: 4_316_000_000_000, operatingProfit: 1_364_000_000_000, netProfit: 1_289_000_000_000,
    financialHistory: [
      { year: '2021', revenue: 1_568_000_000_000, operatingProfit: 389_000_000_000, netProfit: 318_000_000_000, eps: 4508 },
      { year: '2022', revenue: 3_006_000_000_000, operatingProfit: 968_000_000_000, netProfit: 872_000_000_000, eps: 12354 },
      { year: '2023', revenue: 3_457_000_000_000, operatingProfit: 1_044_000_000_000, netProfit: 963_000_000_000, eps: 13644 },
      { year: '2024', revenue: 4_316_000_000_000, operatingProfit: 1_364_000_000_000, netProfit: 1_289_000_000_000, eps: 18264 },
    ],
    analystRatings: { strongBuy: 18, buy: 7, hold: 2, sell: 0, upsideTarget: 1.23 },
  },
  '035420': {
    code: '035420', yahooSymbol: '035420.KS', name: 'NAVER',
    sector: 'IT서비스', market: 'KOSPI', ceo: '최수연', founded: '1999년', employees: 14000,
    description: '국내 1위 인터넷 포털. 검색·쇼핑·금융·클라우드·웹툰·AI 하이퍼클로바 X 기반 서비스 확대.',
    shortReason: '하락 추세 지속 중, 지지선 확인 후 매수 검토',
    longReason: 'AI 검색 전환 성공, 클라우드·커머스 성장, 라인야후 리스크 해소',
    targetMultiplier: 1.13, stopLossMultiplier: 0.97,
    roe: 9.8, debtRatio: 35.6, dividendYield: 0.45, revenueGrowth: 10.2, operatingMargin: 15.8,
    revenue: 10_196_000_000_000, operatingProfit: 1_612_000_000_000, netProfit: 1_384_000_000_000,
    financialHistory: [
      { year: '2021', revenue: 6_818_000_000_000, operatingProfit: 1_326_000_000_000, netProfit: 1_242_000_000_000, eps: 7539 },
      { year: '2022', revenue: 8_220_000_000_000, operatingProfit: 1_325_000_000_000, netProfit: 784_000_000_000, eps: 4761 },
      { year: '2023', revenue: 9_256_000_000_000, operatingProfit: 1_456_000_000_000, netProfit: 1_108_000_000_000, eps: 6726 },
      { year: '2024', revenue: 10_196_000_000_000, operatingProfit: 1_612_000_000_000, netProfit: 1_384_000_000_000, eps: 8399 },
    ],
    analystRatings: { strongBuy: 12, buy: 14, hold: 6, sell: 1, upsideTarget: 1.26 },
  },
  '105560': {
    code: '105560', yahooSymbol: '105560.KS', name: 'KB금융',
    sector: '금융', market: 'KOSPI', ceo: '양종희', founded: '2008년', employees: 25000,
    description: '국내 최대 금융그룹. KB국민은행, KB증권, KB손해보험 등 종합금융 서비스. 밸류업 프로그램 최대 수혜.',
    shortReason: '저PBR 해소 기대, 밸류업 수혜주, 배당 매력',
    longReason: '밸류업 프로그램 최대 수혜, 주주환원 확대, 고금리 유지로 NIM 개선',
    targetMultiplier: 1.11, stopLossMultiplier: 0.96,
    roe: 10.4, debtRatio: 82.4, dividendYield: 4.89, revenueGrowth: 5.8, operatingMargin: 35.6,
    revenue: 29_800_000_000_000, operatingProfit: 6_400_000_000_000, netProfit: 4_894_000_000_000,
    financialHistory: [
      { year: '2021', revenue: 24_500_000_000_000, operatingProfit: 5_200_000_000_000, netProfit: 4_089_000_000_000, eps: 9821 },
      { year: '2022', revenue: 27_200_000_000_000, operatingProfit: 5_800_000_000_000, netProfit: 4_430_000_000_000, eps: 10653 },
      { year: '2023', revenue: 28_100_000_000_000, operatingProfit: 6_100_000_000_000, netProfit: 4_663_000_000_000, eps: 11210 },
      { year: '2024', revenue: 29_800_000_000_000, operatingProfit: 6_400_000_000_000, netProfit: 4_894_000_000_000, eps: 11764 },
    ],
    analystRatings: { strongBuy: 20, buy: 10, hold: 2, sell: 0, upsideTarget: 1.23 },
  },
};

export const STOCK_LIST: { code: string; yahooSymbol: string; name: string; sector: string; market: 'KOSPI' | 'KOSDAQ' }[] = [
  { code: '005930', yahooSymbol: '005930.KS', name: '삼성전자', sector: '반도체', market: 'KOSPI' },
  { code: '000660', yahooSymbol: '000660.KS', name: 'SK하이닉스', sector: '반도체', market: 'KOSPI' },
  { code: '035420', yahooSymbol: '035420.KS', name: 'NAVER', sector: 'IT서비스', market: 'KOSPI' },
  { code: '051910', yahooSymbol: '051910.KS', name: 'LG화학', sector: '화학/배터리', market: 'KOSPI' },
  { code: '035720', yahooSymbol: '035720.KS', name: '카카오', sector: 'IT서비스', market: 'KOSPI' },
  { code: '207940', yahooSymbol: '207940.KS', name: '삼성바이오로직스', sector: '바이오', market: 'KOSPI' },
  { code: '006400', yahooSymbol: '006400.KS', name: '삼성SDI', sector: '2차전지', market: 'KOSPI' },
  { code: '028260', yahooSymbol: '028260.KS', name: '삼성물산', sector: '건설/유통', market: 'KOSPI' },
  { code: '005490', yahooSymbol: '005490.KS', name: 'POSCO홀딩스', sector: '철강/소재', market: 'KOSPI' },
  { code: '105560', yahooSymbol: '105560.KS', name: 'KB금융', sector: '금융', market: 'KOSPI' },
  { code: '068270', yahooSymbol: '068270.KS', name: '셀트리온', sector: '바이오', market: 'KOSPI' },
  { code: '003550', yahooSymbol: '003550.KS', name: 'LG', sector: '지주회사', market: 'KOSPI' },
  { code: '012330', yahooSymbol: '012330.KS', name: '현대모비스', sector: '자동차부품', market: 'KOSPI' },
  { code: '096770', yahooSymbol: '096770.KS', name: 'SK이노베이션', sector: '에너지', market: 'KOSPI' },
  { code: '018260', yahooSymbol: '018260.KS', name: '삼성에스디에스', sector: 'IT서비스', market: 'KOSPI' },
  { code: '000270', yahooSymbol: '000270.KS', name: '기아', sector: '자동차', market: 'KOSPI' },
];

export const INDEX_LIST = [
  { symbol: '^KS11', name: 'KOSPI' },
  { symbol: '^KQ11', name: 'KOSDAQ' },
  { symbol: '^GSPC', name: 'S&P500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: 'KRW=X', name: 'USD/KRW' },
];

export const SHORT_SIGNALS: Record<string, { signal: 'STRONG_BUY' | 'BUY' | 'WATCH'; strength: number }> = {
  '005930': { signal: 'STRONG_BUY', strength: 5 },
  '000660': { signal: 'BUY', strength: 4 },
  '207940': { signal: 'STRONG_BUY', strength: 5 },
  '051910': { signal: 'BUY', strength: 4 },
  '035420': { signal: 'WATCH', strength: 3 },
  '035720': { signal: 'WATCH', strength: 3 },
  '006400': { signal: 'BUY', strength: 4 },
  '028260': { signal: 'BUY', strength: 3 },
};

export const LONG_RATINGS: Record<string, { consensus: 'STRONG_BUY' | 'BUY' | 'HOLD'; rating: number }> = {
  '005930': { consensus: 'STRONG_BUY', rating: 5 },
  '000660': { consensus: 'STRONG_BUY', rating: 5 },
  '207940': { consensus: 'STRONG_BUY', rating: 5 },
  '035420': { consensus: 'BUY', rating: 4 },
  '005490': { consensus: 'BUY', rating: 4 },
  '051910': { consensus: 'BUY', rating: 4 },
  '105560': { consensus: 'STRONG_BUY', rating: 5 },
  '068270': { consensus: 'BUY', rating: 4 },
};
