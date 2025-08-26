// Vercel Serverless Function: /api/static-geo-data.js
// Serves static GeoJSON data for ABS population grid, hospitals, and roads.

import { connectToDatabase } from '../utils/db'; // Assuming we'll save this data too

export default async function handler(req, res) {
  await connectToDatabase(); // Ensure database connection is established

  // CORS preflight support
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  const { type } = req.query; // e.g., ?type=population, ?type=hospitals, ?type=roads

  let geojsonData;
  try {
    switch (type) {
      case 'population':
        // Placeholder for ABS population grid GeoJSON
        geojsonData = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: [[[115.8, -32.0], [115.9, -32.0], [115.9, -32.1], [115.8, -32.1], [115.8, -32.0]]] },
              properties: { population: 1500, meshblock_id: 'MB123' },
            },
          ],
        };
        // In a real scenario, this would be loaded from a file or database
        // await savePopulationData(geojsonData); // Assuming a savePopulationData function in db.js
        break;
      case 'hospitals':
        // Placeholder for hospital GeoJSON
        geojsonData = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [115.85, -31.96] },
              properties: { name: 'Perth Hospital', type: 'hospital', capacity: 500 },
            },
          ],
        };
        // await saveHospitalData(geojsonData); // Assuming a saveHospitalData function in db.js
        break;
      case 'roads':
        // Placeholder for roads GeoJSON
        geojsonData = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: [[115.8, -31.9], [115.9, -31.9]] },
              properties: { name: 'Main Road', type: 'major_road', lanes: 2 },
            },
          ],
        };
        // await saveRoadData(geojsonData); // Assuming a saveRoadData function in db.js
        break;
      default:
        return res.status(400).json({ error: 'Invalid data type requested. Choose from population, hospitals, or roads.' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(geojsonData);
  } catch (err) {
    console.error('Error in static geo data handler:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
