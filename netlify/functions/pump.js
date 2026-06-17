const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const BOT_SECRET = process.env.BOT_SECRET || 'changeme';
const KEY = 'coincopy:pump';

async function redisCmd(...args) {
  const r = await fetch(`${REDIS_URL}/${args.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  return r.json();
}

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' };

  const auth = event.headers['authorization'] || '';
  if (auth !== `Bearer ${BOT_SECRET}`) return { statusCode: 401, headers, body: JSON.stringify({ error: 'unauthorized' }) };

  const { sym, chg, price, ex } = JSON.parse(event.body || '{}');
  if (!sym || chg === undefined) return { statusCode: 400, headers, body: JSON.stringify({ error: 'sym and chg required' }) };

  if (!REDIS_URL || !REDIS_TOKEN) return { statusCode: 200, headers, body: JSON.stringify({ ok: true, stored: false }) };

  const entry = JSON.stringify({ sym, chg, price: price || 0, ex: ex || 'Bot', time: Date.now() });
  await redisCmd('LPUSH', KEY, entry);
  await redisCmd('LTRIM', KEY, '0', '29');

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, stored: true }) };
};
