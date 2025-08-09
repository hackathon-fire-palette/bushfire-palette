import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function vercelCall(req, res) {
    // Handle CORS if needed
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

    const response = await fetch('https://api.vercel.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use your Vercel AI Gateway API key here
        'Authorization': `Bearer ${process.env.VERCEL_AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // or your preferred Vercel AI model
        messages: [
          {
            role: 'system',
            content: `You are an AI weather prediction specialist for the Australian Bushfire Alert System. 
            Focus on Perth and Western Australia weather conditions, fire risk assessments, and operational recommendations for firefighting teams.
            Always include temperature, wind conditions, fire risk levels, and operational recommendations.
            Keep responses concise but informative.`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Vercel AI error:', errorData);
      return res.status(500).json({ error: 'AI service temporarily unavailable' });
    }

    const data = await response.json();

    // Vercel AI Gateway response structure:
    // data.choices[0].message.content

    return res.status(200).json({
      response: data.choices[0].message.content,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default async function handler(req, res) {
  // Handle CORS if needed
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
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: "system",
          content: `You are an AI weather prediction specialist for the Australian Bushfire Alert System. 
          Focus on Perth and Western Australia weather conditions, fire risk assessments, and operational recommendations for firefighting teams.
          Always include temperature, wind conditions, fire risk levels, and operational recommendations.
          Keep responses concise but informative.`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return res.status(200).json({
      response: completion.choices[0].message.content,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    //return res.status(500).json({ error: 'AI service temporarily unavailable' });
    vercelCall(req, res);
  }
}