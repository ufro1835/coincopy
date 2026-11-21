// ETF 코인 탭용 시세 프록시 (CoinGecko /coins/markets)
// 가격·시총·순위·ATH/ATL 을 한 번의 호출로 가져온다. 선택: 환경변수 COINGECKO_API_KEY (무료 Demo 키)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const ids = String(req.query.ids || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(s => /^[a-z0-9-]{1,64}$/.test(s))
    .slice(0, 100);
  if (!ids.length) return res.status(400).json({ error: 'ids required' });
  try {
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd'
      + `&ids=${ids.join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d`;
    const headers = { accept: 'application/json' };
    if (process.env.COINGECKO_API_KEY) headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
    const r = await fetch(url, { headers });
    if (!r.ok) return res.status(502).json({ error: 'coingecko status ' + r.status });
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: 'etf-markets fetch failed', detail: e.message });
  }
}
