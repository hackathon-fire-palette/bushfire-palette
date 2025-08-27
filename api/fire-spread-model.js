// Vercel Serverless Function: /api/fire-spread-model.js
// Triggers the fire spread model and stores its predictions.

import { connectToDatabase, saveFirePredictions } from '../utils/db';
import { runFireSpreadModel } from '../utils/fire-model';

export default async function handler(req, res) {
  await connectToDatabase(); // Ensure database connection is established

  // CORS preflight support
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { ignitionPoint, fuelMap, wind, humidity, terrainSlope } = req.body;

    if (!ignitionPoint || !fuelMap || !wind || !humidity) {
      return res.status(400).json({ error: 'Missing required parameters: ignitionPoint, fuelMap, wind, humidity' });
    }

    // Placeholder for running the fire spread model
    // In a real implementation, this would call a function that runs the CA model
    // and returns predicted fire polygons.
    const jobId = `fire-sim-${Date.now()}`;
    const predictions = runFireSpreadModel({ ignitionPoint, fuelMap, wind, humidity, terrainSlope });

    const fireSpreadResult = {
      jobId: jobId,
      predictions: predictions,
      timestamp: new Date().toISOString(),
    };

    await saveFirePredictions(fireSpreadResult); // Save results to PostGIS

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ jobId, status: 'Model simulation initiated', predictedPolygons: predictions });
  } catch (err) {
    console.error('Error in fire spread model handler:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
