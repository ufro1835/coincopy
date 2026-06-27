const MAJORS = new Set(['BTC','ETH','SOL','BNB','XRP','ADA','DOGE','TRX','TON','AVAX','DOT','MATIC','LTC','LINK','UNI','ATOM','ETC','BCH','APT','NEAR','OP','ARB','SUI','PEPE','SHIB','FLOKI','BONK']);

function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  let avgG = gains / period, avgL = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgG = (avgG * (period - 1) + (d > 0 ? d : 0)) / period;
    avgL = (avgL * (period - 1) + (d < 0 ? -d : 0)) / period;
  }
  if (avgL === 0) return 100;
  return 100 - 100 / (1 + avgG / avgL);
}

exports.handler = async () => {
  try {
    // CoinGecko: 상위 100개 코인 (페이지 1~2)
    const [p1, p2] = await Promise.all([
      fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=50&page=1&price_change_percentage=24h').then(r => r.json()),
      fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=50&page=2&price_change_percentage=24h').then(r => r.json()),
    ]);
    const all = [...(Array.isArray(p1)?p1:[]), ...(Array.isArray(p2)?p2:[])];

    const candidates = all.filter(c => {
      const sym = (c.symbol || '').toUpperCase();
      return !MAJORS.has(sym) && c.total_volume > 3_000_000;
    }).slice(0, 20);

    const results = await Promise.all(candidates.map(async c => {
      try {
        const sym = c.symbol.toUpperCase();
        const hist = await fetch(
          `https://api.coingecko.com/api/v3/coins/${c.id}/market_chart?vs_currency=usd&days=30&interval=daily`
        ).then(r => r.json());
        if (!hist.prices || hist.prices.length < 16) return null;
        const closes = hist.prices.map(p => p[1]);
        const rsi = calcRSI(closes);
        if (rsi === null) return null;
        const low14 = Math.min(...closes.slice(-15, -1));
        const cur = closes[closes.length - 1];
        const riseFromLow = low14 > 0 ? (cur - low14) / low14 * 100 : 0;
        return {
          sym,
          rsi: Math.round(rsi * 10) / 10,
          chg: c.price_change_percentage_24h || 0,
          vol: c.total_volume,
          riseFromLow: Math.round(riseFromLow * 10) / 10,
          price: c.current_price
        };
      } catch { return null; }
    }));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(results.filter(Boolean))
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
