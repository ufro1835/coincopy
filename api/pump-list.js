// 프론트엔드가 5초마다 폴링 → Redis에서 최근 30개 반환
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'coincopy:pump';

async function redisCmd(...args) {
  const r = await fetch(`${REDIS_URL}/${args.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.json([]);
  }

  try {
    const result = await redisCmd('LRANGE', KEY, '0', '29');
    const items = (result.result || []).map(s => {
      try { return JSON.parse(s); } catch { return null; }
    }).filter(Boolean);
    res.json(items);
  } catch (e) {
    res.status(502).json({ error: 'redis read failed', detail: e.message });
  }
}
