// 바이낸스 선물 펀딩비 프록시
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const data = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex').then(r => r.json());
    const coins = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
    const result = coins.map(sym => {
      const item = data.find(d => d.symbol === sym);
      return { symbol: sym, lastFundingRate: item ? item.lastFundingRate : '0' };
    });
    res.json(result);
  } catch (e) {
    res.status(502).json({ error: 'funding fetch failed', detail: e.message });
  }
}
