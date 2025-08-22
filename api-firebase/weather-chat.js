const functions = require('firebase-functions');
const { OpenAI } = require('openai');

exports.weatherChat = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    const openai = new OpenAI({
      apiKey: functions.config().openai.key, // Set via Firebase config
      baseURL: "https://free.v36.cm/v1", // custom base
    });

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI weather prediction specialist for the Australian Bushfire Alert System. 
          Focus on Perth and Western Australia weather conditions, fire risk assessments, and operational recommendations.
          Always include temperature, wind conditions, fire risk levels, and operational recommendations.`
        },
        { role: "user", content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return res.status(200).json({
      response: chatCompletion.choices[0].message.content,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'AI service unavailable' });
  }
});