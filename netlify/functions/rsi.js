// 거래량 상위 알트코인 심볼 목록 (메이저 제외, 하드코딩)
const SYMBOLS = [
  'HBAR','WLD','JASMY','GALA','HOT','MANA','SAND','ENJ','CHZ','1INCH',
  'CAKE','AAVE','CRV','COMP','SNX','LDO','IMX','MAGIC','BLUR','GMX',
  'DYDX','RNDR','FET','OCEAN','AGIX','INJ','SEI','TIA','PYTH','JTO',
  'WIF','BOME','SLERF','POPCAT','MEW','NEIRO','DOGS','HMSTR','CATI','LUMIA'
];

exports.handler = async () => {
  const symbols = SYMBOLS.map(sym => ({
    sym,
    symbol: sym + 'USDT',
    chg: 0,
    vol: 0,
    price: 0
  }));
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(symbols)
  };
};
