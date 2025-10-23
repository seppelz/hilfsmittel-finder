const fetch = require('node-fetch');
const API_BASE = 'https://hilfsmittel-api.gkv-spitzenverband.de';

module.exports = async function handler(req, res) {
  const { path = '', ...query } = req.query;
  const search = new URLSearchParams(query).toString();
  const targetUrl = `${API_BASE}/${path}${search ? `?${search}` : ''}`;

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: { 'Content-Type': req.headers['content-type'] || 'application/json' },
      body: req.method === 'GET' ? undefined : req.body,
    });

    const body = await upstream.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(upstream.status).send(body);
  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'Proxy request failed', detail: error.message });
  }
};