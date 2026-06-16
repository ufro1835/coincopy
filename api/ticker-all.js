// 바이낸스 전체 티커 (급등 데모용)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const data = await fetch('https://api.binance.com/api/v3/ticker/24hr').then(r => r.json());
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: 'ticker-all fetch failed', detail: e.message });
  }
}
