// 김치프리미엄: 업비트 BTC(KRW) vs 바이낸스 BTC(USD) + 환율
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const [upbitRes, binanceRes, fxRes] = await Promise.all([
      fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC'),
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
      fetch('https://api.frankfurter.app/latest?from=USD&to=KRW').catch(() => null),
    ]);

    const [upbit, binance] = await Promise.all([
      upbitRes.json(),
      binanceRes.json(),
    ]);

    let usdkrw = 1350;
    if (fxRes && fxRes.ok) {
      const fx = await fxRes.json();
      if (fx.rates && fx.rates.KRW) usdkrw = fx.rates.KRW;
    } else {
      // 백업 환율 소스
      try {
        const fx2 = await fetch('https://open.er-api.com/v6/latest/USD').then(r => r.json());
        if (fx2.rates && fx2.rates.KRW) usdkrw = fx2.rates.KRW;
      } catch {}
    }

    const upbitKrw = upbit[0].trade_price;
    const globalKrw = parseFloat(binance.price) * usdkrw;
    const kimp = ((upbitKrw - globalKrw) / globalKrw) * 100;

    res.json({ upbitKrw, globalKrw, usdkrw, kimp });
  } catch (e) {
    res.status(502).json({ error: 'kimp fetch failed', detail: e.message });
  }
}
