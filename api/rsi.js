// RSI 스캐너: 바이낸스 거래량 상위 20종목 일봉 RSI(14)
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const tickers = await fetch('https://api.binance.com/api/v3/ticker/24hr').then(r => r.json());
    const excl = /(USDC|FDUSD|TUSD|BUSD|DAI|UP|DOWN|BULL|BEAR)USDT$/;
    const top = tickers
      .filter(t => t.symbol.endsWith('USDT') && !excl.test(t.symbol))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 15);

    const results = await Promise.all(
      top.map(async t => {
        try {
          const kl = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${t.symbol}&interval=1d&limit=60`
          ).then(r => r.json());
          const closes = kl.map(k => parseFloat(k[4]));
          const rsi = calcRSI(closes);
          if (rsi === null) return null;
          return {
            sym: t.symbol.replace('USDT', ''),
            rsi,
            chg: parseFloat(t.priceChangePercent),
            vol: parseFloat(t.quoteVolume),
            price: parseFloat(t.lastPrice),
          };
        } catch {
          return null;
        }
      })
    );

    res.json(results.filter(Boolean));
  } catch (e) {
    res.status(502).json({ error: 'rsi fetch failed', detail: e.message });
  }
}
