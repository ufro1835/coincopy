const { getStore } = require('@netlify/blobs');

const BOT_SECRET = process.env.BOT_SECRET || 'changeme';

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' };

  // 인증 (Authorization: Bearer 또는 X-Bot-Secret)
  const auth = event.headers['authorization'] || '';
  const xsecret = event.headers['x-bot-secret'] || '';
  if (auth !== `Bearer ${BOT_SECRET}` && xsecret !== BOT_SECRET) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'unauthorized' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: 'invalid json' }; }

  // results 배열 형식 또는 단일 코인 형식 둘 다 지원
  const newCoins = [];
  if (Array.isArray(body.results)) {
    for (const r of body.results) {
      const sym = (r.symbol || '').replace('_USDT', '').replace('USDT', '');
      if (!sym) continue;
      newCoins.push({ sym, chg: parseFloat(r.pump_pct) * 100 || 0, price: r.current_price || 0, ex: 'Gate.io', time: Date.now() });
    }
  } else {
    const { sym, chg, price, ex } = body;
    if (!sym) return { statusCode: 400, headers, body: JSON.stringify({ error: 'sym required' }) };
    newCoins.push({ sym, chg, price: price || 0, ex: ex || 'Bot', time: Date.now() });
  }

  if (!newCoins.length) return { statusCode: 200, headers, body: JSON.stringify({ ok: true, count: 0 }) };

  // Netlify Blobs에 저장
  const store = getStore('pump-signals');
  let existing = [];
  try { existing = await store.get('latest', { type: 'json' }) || []; } catch {}

  const merged = [...newCoins, ...existing].slice(0, 30);
  await store.setJSON('latest', merged);

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, count: newCoins.length }) };
};
