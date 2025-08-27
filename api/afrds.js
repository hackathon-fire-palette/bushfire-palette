// Vercel Serverless Function: /api/afrds.js
// Fetches AFDRS Fire Danger Rating & Fire Behaviour Index data from ArcGIS REST API

export default async function handler(req, res) {
  // CORS preflight support
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  // TODO: Find the actual ArcGIS REST API URL or an authoritative data source for AFDRS Fire Danger Rating & Fire Behaviour Index.
  // This might involve searching government data portals (e.g., data.gov.au) or contacting relevant agencies.
  const arcgisApiUrl = process.env.AFDRS_API_URL || 'https://placeholder.arcgis.com/rest/services/AFDRS/MapServer/0/query'; 

  try {
    // Example query parameters for ArcGIS REST API. These will need to be adjusted based on the actual API.
    const queryParams = new URLSearchParams({
      f: 'json',
      where: '1=1', // Placeholder: refine to query specific areas or timeframes
      outFields: '*', // Request all fields
      returnGeometry: 'true', // Request geometry for mapping
      // time: 'startTime,endTime', // Placeholder for 4-day forecast
      // bbox: 'minx,miny,maxx,maxy', // Optional: restrict to a bounding box
    });

    const response = await fetch(`${arcgisApiUrl}?${queryParams.toString()}`);
    if (!response.ok) {
      // If the placeholder URL is used, return a specific error message
      if (arcgisApiUrl.includes('placeholder.arcgis.com')) {
        return res.status(503).json({ 
          error: 'AFDRS API endpoint not configured', 
          details: 'Please set the AFDRS_API_URL environment variable or replace the placeholder URL with a valid ArcGIS REST API endpoint for AFDRS data.' 
        });
      }
      return res.status(response.status).json({ error: 'Failed to fetch AFDRS data', details: response.statusText });
    }
    const data = await response.json();

    // Process and return relevant AFDRS data.
    // The structure of 'data.features' will depend on the actual ArcGIS service.
    const afrdsData = {
      type: 'FeatureCollection',
      features: data.features.map(feature => ({
        type: 'Feature',
        geometry: feature.geometry, // Assuming geometry is in GeoJSON format or can be converted
        properties: feature.attributes, // ArcGIS attributes usually contain the data
      })),
      // Add other relevant metadata from the API response if available
      metadata: {
        source: 'AFDRS ArcGIS REST API',
        timestamp: new Date().toISOString(),
      },
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(afrdsData);
  } catch (err) {
    console.error('Error in AFDRS handler:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
