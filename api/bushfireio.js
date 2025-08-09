// Vercel Serverless Function: /api/bushfireio.js
// Proxies bushfire.io incidents to bypass CORS for frontend



export default async function handler(req, res) {
  // CORS preflight support
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  const waIncidentsUrl = 'https://www.emergency.wa.gov.au/data/map/incidents.json';
  try {
    const response = await fetch(waIncidentsUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch Emergency WA data' });
    }
    const data = await response.json();
    // Normalize to bushfire incident format expected by frontend
    const bushfireTypes = ['bushfire', 'fire', 'bush fire', 'scrub fire', 'grass fire'];
    const incidents = Array.isArray(data.incidents)
      ? data.incidents.filter(i => {
          const t = (i.type || '').toLowerCase();
          return bushfireTypes.some(type => t.includes(type));
        })
        .map(i => {
          // Geometry: Point or Polygon
          let location = null;
          if (i.geometry && i.geometry.type === 'Point' && Array.isArray(i.geometry.coordinates) && i.geometry.coordinates.length === 2) {
            location = { lat: i.geometry.coordinates[1], lng: i.geometry.coordinates[0] };
          } else if (i.geometry && i.geometry.type === 'Polygon' && Array.isArray(i.geometry.coordinates) && i.geometry.coordinates[0] && i.geometry.coordinates[0][0]) {
            // Use centroid of polygon for marker
            const coords = i.geometry.coordinates[0];
            const n = coords.length;
            let sumLat = 0, sumLng = 0;
            coords.forEach(([lng, lat]) => { sumLat += lat; sumLng += lng; });
            location = { lat: sumLat / n, lng: sumLng / n };
          }
          return {
            title: i.title || 'Bushfire',
            status: i.status || '',
            location,
            locationDesc: i.locality || i.area || '',
            updated: i.updated || i.created || null,
            type: i.type || '',
            agency: i.agency || '',
            description: i.description || '',
            url: i.url || ''
          };
        })
      : [];
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(incidents);
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
