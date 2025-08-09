// Vercel Serverless Function: /api/bushfireio.js
// Proxies bushfire.io incidents to bypass CORS for frontend

export default async function handler(req, res) {
  const apiUrl = 'https://api.bushfire.io/incidents';
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch bushfire.io data' });
    }
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
