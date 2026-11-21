// ETF 코인 탭용 시세 프록시 (CoinGecko /coins/markets) - Netlify 버전
exports.handler = async (event) => {
  const headersOut = { 'Access-Control-Allow-Origin': '*' };
  const ids = String((event.queryStringParameters || {}).ids || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(s => /^[a-z0-9-]{1,64}$/.test(s))
    .slice(0, 100);
  if (!ids.length) return { statusCode: 400, headers: headersOut, body: JSON.stringify({ error: 'ids required' }) };
  try {
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd'
      + `&ids=${ids.join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d`;
    const headers = { accept: 'application/json' };
    if (process.env.COINGECKO_API_KEY) headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
    const r = await fetch(url, { headers });
    if (!r.ok) return { statusCode: 502, headers: headersOut, body: JSON.stringify({ error: 'coingecko status ' + r.status }) };
    const data = await r.json();
    return {
      statusCode: 200,
      headers: { ...headersOut, 'Cache-Control': 'public, max-age=30, s-maxage=60' },
      body: JSON.stringify(data),
    };
  } catch (e) {
    return { statusCode: 502, headers: headersOut, body: JSON.stringify({ error: e.message }) };
  }
};
