// Vercel Serverless Function: /api/simulate/results/[jobId].js
// Retrieves fire spread model predictions for a given job ID.

import { connectToDatabase, getFirePredictionsByJobId } from '../../../utils/db';

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
    const firePredictions = await getFirePredictionsByJobId(jobId);

    if (!firePredictions) {
      return res.status(404).json({ error: `No fire predictions found for job ID: ${jobId}` });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(firePredictions);
  } catch (err) {
    console.error(`Error fetching fire predictions for job ${jobId}:`, err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
