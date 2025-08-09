// Vercel Serverless Function: /api/bushfireio.js
// Proxies bushfire.io incidents to bypass CORS for frontend

export default async function handler(req, res) {
  // Try AFAC first
  const afacUrl = 'https://www.afac.com.au/auxiliary/afac-warnings.json';
  try {
    const response = await fetch(afacUrl);
    if (response.ok) {
      const data = await response.json();
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
    }
  } catch (err) {
    // If AFAC fails, fall through to WA scrape
  }

  // Fallback: Scrape Emergency WA website for incident titles (no geo, just demo)
  try {
    const waUrl = 'https://www.emergency.wa.gov.au/';
    const html = await fetch(waUrl).then(r => r.text());
    // Simple regex to find incident titles in the HTML (demo only, not robust)
    const incidentMatches = [...html.matchAll(/<div class="incident-title">(.*?)<\/div>/g)];
    const incidents = incidentMatches.map(m => ({
      title: m[1].replace(/<[^>]+>/g, '').trim(),
      status: 'Unknown',
      location: null,
      locationDesc: 'WA',
      updated: null
    }));
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(incidents);
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
