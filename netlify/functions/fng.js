exports.handler = async () => {
  try {
    const j = await fetch('https://api.alternative.me/fng/?limit=2').then(r => r.json());
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ data: j.data }) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
};
