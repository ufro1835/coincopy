const { getStore } = require('@netlify/blobs');

exports.handler = async () => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };
  try {
    const store = getStore('pump-signals');
    const items = await store.get('latest', { type: 'json' }) || [];
    return { statusCode: 200, headers, body: JSON.stringify(items) };
  } catch (e) {
    return { statusCode: 200, headers, body: JSON.stringify([]) };
  }
};
