const { Configuration, OpenAIApi } = require("openai");

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    const configuration = new Configuration({
      apiKey: process.env.CHATGPT_API_KEY,
      basePath: "https://free.v36.cm/v1"
    });
    
    const openai = new OpenAIApi(configuration);

    const chatCompletion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: `You are an AI weather prediction specialist for the Australian Bushfire Alert System. 
        Focus on Perth and Western Australia weather conditions, fire risk assessments, and operational recommendations.
        Always include temperature, wind conditions, fire risk levels, and operational recommendations.`
      }, {
        role: "user",
        content: message
      }],
      max_tokens: 500,
      temperature: 0.7
    });

    return res.status(200).json({
      response: chatCompletion.data.choices[0].message.content,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'AI service unavailable' });
  }
}
