import { saveWeatherData, connectToDatabase } from '../utils/db';

// Vercel Serverless Function: /api/bom-weather.js
// Fetches BOM weather data (temperature, humidity, wind speed/direction)

export default async function handler(req, res) {
  await connectToDatabase(); // Ensure database connection is established

  // CORS preflight support
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  // Placeholder for BOM API URL - actual URL needs to be determined
  const bomApiUrl = 'https://api.bom.gov.au/v1/locations/IDN60901/observations'; // Example, needs to be replaced with actual API endpoint for WA

  try {
    const response = await fetch(bomApiUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch BOM data' });
    }
    const data = await response.json();

    // Process and return relevant weather data
    // This is a placeholder and needs to be adapted based on actual BOM API response structure
    const weatherData = {
      temperature: data.data.temperature,
      humidity: data.data.humidity,
      windSpeed: data.data.wind_speed_kmh,
      windDirection: data.data.wind_direction,
      timestamp: new Date().toISOString(),
      latitude: -31.95, // Placeholder for a location in WA
      longitude: 115.86, // Placeholder for a location in WA
    };

    await saveWeatherData(weatherData); // Save data to the database

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(weatherData);
  } catch (err) {
    console.error('Error in BOM weather handler:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
