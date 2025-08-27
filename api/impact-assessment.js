// Vercel Serverless Function: /api/impact-assessment.js
// Calculates and exposes fire impact assessment.

import { connectToDatabase, getFirePredictionsByJobId, getGeoData } from '../utils/db';
// getGeoData will be a new function to fetch population, hospitals, roads, cadastral data

export default async function handler(req, res) {
  await connectToDatabase(); // Ensure database connection is established

  // CORS preflight support
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  const { jobId } = req.query;

  if (!jobId) {
    return res.status(400).json({ error: 'Missing required parameter: jobId' });
  }

  try {
    // 1. Fetch predicted fire polygons for the given jobId
    const firePredictions = await getFirePredictionsByJobId(jobId);
    if (!firePredictions || firePredictions.length === 0) {
      return res.status(404).json({ error: `No fire predictions found for job ID: ${jobId}` });
    }

    // 2. Fetch static geo data (population, households, hospitals, roads)
    // These functions need to be implemented in utils/db.js
    const populationData = await getGeoData('population');
    const hospitalsData = await getGeoData('hospitals');
    const roadsData = await getGeoData('roads');
    const cadastralData = await getGeoData('cadastral'); // For households/parcels

    // 3. Perform impact assessment calculations (placeholder logic)
    const impactResults = {
      jobId: jobId,
      timestamp: new Date().toISOString(),
      summary: {
        parcelsAtRisk: 0,
        populationExposed: 0,
        criticalInfrastructureThreatened: {
          hospitals: [],
          roads: [],
          schools: [], // Assuming schools data will be added later
        },
      },
      timeToImpactCategories: {
        '0-30m': { parcels: 0, population: 0, hospitals: [], roads: [] },
        '30-60m': { parcels: 0, population: 0, hospitals: [], roads: [] },
        '1-3h': { parcels: 0, population: 0, hospitals: [], roads: [] },
      },
      // Detailed GeoJSON results could be added here
    };

    // Placeholder for intersection logic
    // In a real implementation, this would involve complex PostGIS queries
    // to intersect fire polygons with other geospatial layers.
    console.log(`Performing impact assessment for job ${jobId}`);

    // Example: Simple check if any fire polygon exists
    if (firePredictions.length > 0) {
      impactResults.summary.parcelsAtRisk = 10; // Dummy value
      impactResults.summary.populationExposed = 50; // Dummy value
      impactResults.summary.criticalInfrastructureThreatened.hospitals.push({ name: 'Perth Hospital', distance: '10km' });
      impactResults.timeToImpactCategories['0-30m'].parcels = 5;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(impactResults);
  } catch (err) {
    console.error('Error in impact assessment handler:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
