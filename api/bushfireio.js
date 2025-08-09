// Vercel Serverless Function: /api/bushfireio.js
// Proxies bushfire.io incidents to bypass CORS for frontend

export default async function handler(req, res) {
  // AFAC national warnings feed
  const apiUrl = 'https://www.afac.com.au/auxiliary/afac-warnings.json';
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch AFAC data' });
    }
    const data = await response.json();
    // Normalize AFAC warnings to bushfire incident format expected by frontend
    const incidents = Array.isArray(data.warnings)
      ? data.warnings.filter(w => w.category && w.category.toLowerCase().includes('fire'))
        .map(w => ({
          title: w.headline || 'Bushfire',
          status: w.status || '',
          location: w.location && w.location.lat && w.location.lon
            ? { lat: w.location.lat, lng: w.location.lon }
            : null,
          locationDesc: w.area || '',
          updated: w.updated || w.issued || null
        }))
      : [];
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(incidents);
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
