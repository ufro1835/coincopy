const MAJORS = new Set(['BTC','ETH','SOL','BNB','XRP','ADA','DOGE','TRX','TON','AVAX','DOT','MATIC','LTC','LINK','UNI','ATOM','ETC','BCH','APT','NEAR','OP','ARB','SUI','PEPE','SHIB','FLOKI','BONK']);
const EXCL = /(USDC|FDUSD|TUSD|BUSD|DAI|UP|DOWN|BULL|BEAR|USDT)USDT$/;

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
    const tickers = await fetch('https://api.binance.com/api/v3/ticker/24hr').then(r => r.json());
    const candidates = tickers
      .filter(t => {
        if (!t.symbol.endsWith('USDT') || EXCL.test(t.symbol)) return false;
        const base = t.symbol.replace('USDT', '');
        if (MAJORS.has(base)) return false;
        return parseFloat(t.quoteVolume) > 3_000_000;
      })
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 40);

    const BATCH = 20;
    const results = [];
    for (let i = 0; i < candidates.length; i += BATCH) {
      const batch = candidates.slice(i, i + BATCH);
      const batchRes = await Promise.all(batch.map(async t => {
        try {
          const kl = await fetch(`https://api.binance.com/api/v3/klines?symbol=${t.symbol}&interval=1d&limit=30`).then(r => r.json());
          if (!Array.isArray(kl) || kl.length < 16) return null;
          const closes = kl.map(k => parseFloat(k[4]));
          const volumes = kl.map(k => parseFloat(k[5]));
          const rsi = calcRSI(closes);
          if (rsi === null) return null;
          const low14 = Math.min(...closes.slice(-15, -1));
          const cur = closes[closes.length - 1];
          const riseFromLow = low14 > 0 ? (cur - low14) / low14 * 100 : 0;
          const vol1 = volumes[volumes.length - 1];
          const vol7avg = volumes.slice(-8, -1).reduce((a, b) => a + b, 0) / 7;
          const volChange = vol7avg > 0 ? (vol1 - vol7avg) / vol7avg * 100 : 0;
          const sym = t.symbol.replace('USDT', '');
          return {
            sym,
            rsi: Math.round(rsi * 10) / 10,
            chg: parseFloat(t.priceChangePercent),
            vol: parseFloat(t.quoteVolume),
            volChange: Math.round(volChange * 10) / 10,
            riseFromLow: Math.round(riseFromLow * 10) / 10,
            price: parseFloat(t.lastPrice)
          };
        } catch { return null; }
      }));
      results.push(...batchRes.filter(Boolean));
    }

    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(results) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
