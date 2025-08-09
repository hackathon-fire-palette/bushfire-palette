import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // ... existing CORS setup ...
  
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
    return res.status(500).json({ error: 'AI service temporarily unavailable' });
  }
}