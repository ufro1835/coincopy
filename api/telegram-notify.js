// 클라이언트(브라우저)에서 신호 감지 시 호출 → 텔레그램으로 전달
// 봇 토큰은 여기(서버) 환경변수에만 있고 프론트엔드 코드엔 절대 안 들어감
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const NOTIFY_SECRET = process.env.NOTIFY_SECRET || 'changeme';

const TYPE_LABELS = {
  div: '📉 고점돌파 + RSI 하락다이버전스 (숏 신호)',
  div_bull: '📈 저점돌파 + RSI 상승다이버전스 (롱 신호)',
  breakout: '🚀 신고점 돌파 (등록 종목)',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const auth = req.headers['authorization'] || '';
  if (auth !== `Bearer ${NOTIFY_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { sym, type } = req.body || {};
  const label = TYPE_LABELS[type];
  if (!sym || !/^[A-Z0-9]{2,15}$/.test(sym) || !label) {
    return res.status(400).json({ error: 'invalid sym or type' });
  }

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: 'telegram not configured' });
  }

  try {
    const text = `${sym}\n${label}`;
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text }),
    });
    const tgData = await tgRes.json();
    if (!tgData.ok) {
      return res.status(502).json({ error: 'telegram send failed', detail: tgData });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(502).json({ error: 'telegram request failed', detail: e.message });
  }
}
