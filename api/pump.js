// 텔레그램 봇 → 이 엔드포인트로 POST → Redis에 저장
// 봇은 Authorization: Bearer {BOT_SECRET} 헤더 포함해서 POST
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  // 인증
  const auth = req.headers['authorization'] || '';
  if (auth !== `Bearer ${BOT_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { sym, chg, price, ex } = req.body || {};
  if (!sym || chg === undefined) {
    return res.status(400).json({ error: 'sym and chg required' });
  }

  if (!REDIS_URL || !REDIS_TOKEN) {
    // Redis 미설정 시 그냥 성공 응답 (데이터는 저장 안 됨)
    return res.json({ ok: true, stored: false, reason: 'redis not configured' });
  }

  const entry = JSON.stringify({ sym, chg, price: price || 0, ex: ex || 'Bot', time: Date.now() });
  await redisCmd('LPUSH', KEY, entry);
  await redisCmd('LTRIM', KEY, '0', '29');

  res.json({ ok: true, stored: true });
}
