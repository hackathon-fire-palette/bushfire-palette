import OpenAI from "openai";

export const handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { message } = JSON.parse(event.body);

    const openai = new OpenAI({
      apiKey: process.env.CHATGPT_API_KEY,
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: chatCompletion.choices[0].message.content,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'AI service unavailable' }),
    };
  }
};