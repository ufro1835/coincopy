exports.handler = async () => {
  try {
    const data = await fetch('https://api.binance.com/api/v3/ticker/24hr').then(r => r.json());
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
