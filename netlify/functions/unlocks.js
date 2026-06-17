exports.handler = async () => {
  try {
    const data = await fetch('https://api.llama.fi/emissions').then(r => r.json());
    const now = Date.now() / 1000;
    const items = [];
    for (const proto of data) {
      if (!proto.events) continue;
      const future = proto.events.filter(e => e.timestamp > now).sort((a, b) => a.timestamp - b.timestamp)[0];
      if (future) {
        const noOfTokens = Array.isArray(future.noOfTokens) ? future.noOfTokens[0] : future.noOfTokens;
        items.push({ name: proto.name || proto.token || '?', ts: future.timestamp, usd: proto.tPrice && noOfTokens ? proto.tPrice * noOfTokens : null });
      }
    }
    items.sort((a, b) => a.ts - b.ts);
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(items.slice(0, 8)) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
