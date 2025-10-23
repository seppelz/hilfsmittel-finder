import fetch from 'node-fetch';

const API_BASE = 'https://hilfsmittel-api.gkv-spitzenverband.de';

export default async function handler(req, res) {
  const { path = '', ...query } = req.query;
  const search = new URLSearchParams(query).toString();
  const targetUrl = `${API_BASE}/${path}${search ? `?${search}` : ''}`;

  try {
    console.log('[proxy] forwarding request', {
      method: req.method,
      targetUrl,
      hasBody: Boolean(req.body),
    });
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: { 'Content-Type': req.headers['content-type'] || 'application/json' },
      body: req.method === 'GET' ? undefined : req.body,
    });

    console.log('[proxy] upstream response', {
      status: upstream.status,
      statusText: upstream.statusText,
      url: upstream.url,
    });
    const body = await upstream.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(upstream.status).send(body);
  } catch (error) {
    console.error('[proxy] error', {
      message: error.message,
      stack: error.stack,
      targetUrl,
    });
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'Proxy request failed', detail: error.message });
  }
}