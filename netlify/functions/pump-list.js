const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'coincopy:pump';

async function redisCmd(...args) {
  const r = await fetch(`${REDIS_URL}/${args.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  return r.json();
}

exports.handler = async () => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };
  if (!REDIS_URL || !REDIS_TOKEN) return { statusCode: 200, headers, body: JSON.stringify([]) };
  try {
    const result = await redisCmd('LRANGE', KEY, '0', '29');
    const items = (result.result || []).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
    return { statusCode: 200, headers, body: JSON.stringify(items) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
