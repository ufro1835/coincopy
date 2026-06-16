// 공포탐욕지수 (Alternative.me)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const j = await fetch('https://api.alternative.me/fng/?limit=2').then(r => r.json());
    res.json({ data: j.data });
  } catch (e) {
    res.status(502).json({ error: 'fng fetch failed', detail: e.message });
  }
}
