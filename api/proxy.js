export default async function handler(req, res) {
  const { path = '', ...query } = req.query
  const queryString = new URLSearchParams(query).toString()
  const targetUrl = `https://hilfsmittel-api.gkv-spitzenverband.de/${path}${queryString ? `?${queryString}` : ''}`

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      body: req.method === 'GET' ? undefined : req.body,
    })

    const data = await upstream.text()
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(upstream.status).send(data)
  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(500).json({ error: 'Proxy request failed', detail: error.message })
  }
}