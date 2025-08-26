import { saveHotspotData, connectToDatabase } from '../utils/db';

// Vercel Serverless Function: /api/nasa-firms.js
// Fetches NASA FIRMS (VIIRS/MODIS) hotspot data

export default async function handler(req, res) {
  await connectToDatabase(); // Ensure database connection is established

  // CORS preflight support
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  // Placeholder for NASA FIRMS API URL - actual URL needs to be determined
  // Example: https://firms.modaps.eosdis.nasa.gov/api/area/csv/YOUR_API_KEY/MODIS_NRT/world/1/2024-01-01
  // This will likely require an API key and specific parameters for the region (WA) and time frame.
  const nasaFirmsApiUrl = 'https://firms.modaps.eosdis.nasa.gov/api/country/csv/YOUR_API_KEY/VIIRS_SNPP_NRT/AUS/1/2024-01-01'; // Placeholder

  try {
    // In a real implementation, you'd need to handle API keys securely (e.g., environment variables)
    // and construct the URL with dynamic dates and potentially bounding box for WA.
    const response = await fetch(nasaFirmsApiUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch NASA FIRMS data' });
    }
    // NASA FIRMS often returns CSV. This example assumes JSON for simplicity,
    // but a real implementation would need to parse CSV.
    const data = await response.text(); // Assuming CSV for now

    // Placeholder for processing FIRMS data
    // A real implementation would parse the CSV and convert it to a structured format (e.g., GeoJSON)
    // For demonstration, let's assume a simple CSV format: latitude,longitude,brightness,confidence,timestamp
    const lines = data.trim().split('\n');
    const hotspots = [];
    if (lines.length > 1) { // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const [latitude, longitude, brightness, confidence, timestamp] = lines[i].split(',');
        hotspots.push({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          brightness: parseFloat(brightness),
          confidence: confidence,
          timestamp: new Date(timestamp).toISOString(),
        });
      }
    } else {
      // Fallback to placeholder if no data or parsing fails
      hotspots.push({
        latitude: -31.95,
        longitude: 115.86,
        brightness: 320,
        confidence: 'high',
        timestamp: new Date().toISOString(),
      });
    }

    for (const hotspot of hotspots) {
      await saveHotspotData(hotspot); // Save each hotspot to the database
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(hotspots);
  } catch (err) {
    console.error('Error in NASA FIRMS handler:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
