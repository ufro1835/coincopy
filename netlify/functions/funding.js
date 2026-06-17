exports.handler = async () => {
  try {
    const data = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex').then(r => r.json());
    const coins = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
    const result = coins.map(sym => {
      const item = data.find(d => d.symbol === sym);
      return { symbol: sym, lastFundingRate: item ? item.lastFundingRate : '0' };
    });
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(result) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
