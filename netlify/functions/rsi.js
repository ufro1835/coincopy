const MAJORS = new Set(['BTC','ETH','SOL','BNB','XRP','ADA','DOGE','TRX','TON','AVAX','DOT','MATIC','LTC','LINK','UNI','ATOM','ETC','BCH','APT','NEAR','OP','ARB','SUI','PEPE','SHIB','FLOKI','BONK']);
const EXCL = /(USDC|FDUSD|TUSD|BUSD|DAI|UP|DOWN|BULL|BEAR|USDT)USDT$/;

// 심볼 목록만 반환 - RSI 계산은 프론트에서 직접 Binance 호출
exports.handler = async () => {
  try {
    const tickers = await fetch('https://api.binance.com/api/v3/ticker/24hr').then(r => r.json());
    if (!Array.isArray(tickers)) throw new Error('Binance API unavailable');
    const symbols = tickers
      .filter(t => {
        if (!t.symbol.endsWith('USDT') || EXCL.test(t.symbol)) return false;
        const base = t.symbol.replace('USDT', '');
        if (MAJORS.has(base)) return false;
        return parseFloat(t.quoteVolume) > 3_000_000;
      })
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 30)
      .map(t => ({
        sym: t.symbol.replace('USDT', ''),
        symbol: t.symbol,
        chg: parseFloat(t.priceChangePercent),
        vol: parseFloat(t.quoteVolume),
        price: parseFloat(t.lastPrice)
      }));
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(symbols) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
