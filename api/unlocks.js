// DefiLlama 토큰 언락 일정
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const data = await fetch('https://api.llama.fi/emissions').then(r => r.json());
    const now = Date.now() / 1000;
    const items = [];
    for (const proto of data) {
      if (!proto.events) continue;
      const future = proto.events
        .filter(e => e.timestamp > now)
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      if (future) {
        const noOfTokens = Array.isArray(future.noOfTokens) ? future.noOfTokens[0] : future.noOfTokens;
        items.push({
          name: proto.name || proto.token || '?',
          ts: future.timestamp,
          usd: proto.tPrice && noOfTokens ? proto.tPrice * noOfTokens : null,
        });
      }
    }
    items.sort((a, b) => a.ts - b.ts);
    res.json(items.slice(0, 8));
  } catch (e) {
    res.status(502).json({ error: 'unlocks fetch failed', detail: e.message });
  }
}
