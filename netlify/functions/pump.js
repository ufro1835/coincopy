const BOT_SECRET = process.env.BOT_SECRET || 'changeme';
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'pump-signals';

async function redisCmd(...args) {
  const res = await fetch(`${REDIS_URL}/${args.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
  });
  return res.json();
}

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' };

  const auth = event.headers['authorization'] || '';
  const xsecret = event.headers['x-bot-secret'] || '';
  if (auth !== `Bearer ${BOT_SECRET}` && xsecret !== BOT_SECRET) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'unauthorized' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: 'invalid json' }; }

  const newCoins = [];
  if (Array.isArray(body.results)) {
    for (const r of body.results) {
      const sym = (r.symbol || '').replace('_USDT', '').replace('USDT', '');
      if (!sym) continue;
      newCoins.push(JSON.stringify({ sym, chg: parseFloat(r.pump_pct) * 100 || 0, price: r.current_price || 0, ex: 'Gate.io', time: Date.now() }));
    }
  } else {
    const { sym, chg, price, ex } = body;
    if (!sym) return { statusCode: 400, headers, body: JSON.stringify({ error: 'sym required' }) };
    newCoins.push(JSON.stringify({ sym, chg, price: price || 0, ex: ex || 'Bot', time: Date.now() }));
  }

  if (!newCoins.length) return { statusCode: 200, headers, body: JSON.stringify({ ok: true, count: 0 }) };

  for (const coin of newCoins) {
    await redisCmd('LPUSH', KEY, coin);
  }
  await redisCmd('LTRIM', KEY, '0', '29');

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, count: newCoins.length }) };
};
