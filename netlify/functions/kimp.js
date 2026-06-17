exports.handler = async () => {
  try {
    const [upbitRes, binanceRes, fxRes] = await Promise.all([
      fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC'),
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
      fetch('https://api.frankfurter.app/latest?from=USD&to=KRW').catch(() => null),
    ]);
    const [upbit, binance] = await Promise.all([upbitRes.json(), binanceRes.json()]);
    let usdkrw = 1350;
    if (fxRes && fxRes.ok) {
      const fx = await fxRes.json();
      if (fx.rates && fx.rates.KRW) usdkrw = fx.rates.KRW;
    }
    const upbitKrw = upbit[0].trade_price;
    const globalKrw = parseFloat(binance.price) * usdkrw;
    const kimp = ((upbitKrw - globalKrw) / globalKrw) * 100;
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ upbitKrw, globalKrw, usdkrw, kimp }) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
