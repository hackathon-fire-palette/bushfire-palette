// Vercel AI Gateway for Weather Prediction Chat
// Uses OpenAI or compatible AI service for weather predictions

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // For demo purposes, we'll use a mock AI response
    // In production, you would integrate with OpenAI, Anthropic, or another AI service
    const mockWeatherPrediction = generateWeatherPrediction(message);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return res.status(200).json({
      response: mockWeatherPrediction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Weather chat error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function generateWeatherPrediction(message) {
  const currentDate = new Date();
  const nextWeek = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  // Mock weather scenarios for Perth
  const weatherScenarios = [
    {
      condition: "Partly cloudy with light winds",
      temperature: "18-24°C",
      windSpeed: "15-20 km/h",
      fireRisk: "Low to Moderate",
      details: "Ideal conditions with moderate humidity. Good visibility for firefighting operations if needed."
    },
    {
      condition: "Hot and dry with strong easterly winds",
      temperature: "28-35°C", 
      windSpeed: "35-45 km/h",
      fireRisk: "High to Extreme",
      details: "High fire danger conditions expected. Consider pre-positioning resources and issuing fire bans."
    },
    {
      condition: "Cool and overcast with light rain possible",
      temperature: "14-20°C",
      windSpeed: "10-15 km/h", 
      fireRisk: "Low",
      details: "Favorable conditions with increased humidity. Good opportunity for controlled burns."
    }
  ];

  // Select a random scenario for demo
  const scenario = weatherScenarios[Math.floor(Math.random() * weatherScenarios.length)];
  
  return `🌤️ **Weather Prediction for Perth - ${nextWeek.toDateString()}**

**Conditions:** ${scenario.condition}
**Temperature:** ${scenario.temperature}
**Wind Speed:** ${scenario.windSpeed}
**Fire Risk Level:** ${scenario.fireRisk}

**Operational Impact:** ${scenario.details}

**Recommendation:** Based on these conditions, ${scenario.fireRisk === "High to Extreme" ? "increase readiness levels and consider resource pre-deployment" : "standard operational procedures apply"}.

*Note: This is a predictive model for operational planning. Always consult official weather services for real-time updates.*`;
}
