# AI Gateway Setup Guide

This guide explains how to configure the Vercel AI Gateway for weather prediction in your bushfire alert system.

## Current Implementation

The system currently includes:
- **Mock AI Response**: `/api/weather-chat.js` with simulated weather predictions
- **Chat Interface**: Integrated chatbox on the dashboard
- **Quick Actions**: Pre-built questions for common scenarios

## Production AI Integration Options

### Option 1: OpenAI Integration

1. **Install Dependencies**:
```bash
npm install openai
```

2. **Environment Variables** (in Vercel dashboard):
```env
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-4-turbo-preview
```

3. **Update `/api/weather-chat.js`**:
```javascript
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
```

### Option 2: Anthropic Claude Integration

1. **Install Dependencies**:
```bash
npm install @anthropic-ai/sdk
```

2. **Environment Variables**:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

3. **Update `/api/weather-chat.js`**:
```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  // ... existing setup ...
  
  try {
    const { message } = req.body;
    
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 500,
      system: `You are an AI weather prediction specialist for the Australian Bushfire Alert System...`,
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    });

    return res.status(200).json({
      response: response.content[0].text,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Anthropic API error:', error);
    return res.status(500).json({ error: 'AI service temporarily unavailable' });
  }
}
```

### Option 3: Azure OpenAI Integration

1. **Install Dependencies**:
```bash
npm install @azure/openai
```

2. **Environment Variables**:
```env
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
```

## Enhanced Features

### Weather Data Integration

Enhance predictions by integrating real weather APIs:

```javascript
// Add to weather-chat.js
async function getWeatherData() {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=-31.9505&longitude=115.8605&daily=temperature_2m_max,temperature_2m_min,windspeed_10m_max,precipitation_sum&forecast_days=7`
  );
  return response.json();
}
```

### Fire Danger Rating Integration

Connect with official fire danger APIs:

```javascript
// Integration with Australian fire danger rating systems
async function getFireDangerRating() {
  // Connect to state fire service APIs
  // This would require authentication and proper API access
}
```

## Security Considerations

1. **API Key Protection**: Never expose API keys in frontend code
2. **Rate Limiting**: Implement request throttling
3. **Input Validation**: Sanitize all user inputs
4. **Error Handling**: Graceful fallbacks for service outages

## Deployment

1. **Vercel Environment Variables**:
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add your chosen AI service API keys

2. **Deploy**:
```bash
vercel --prod
```

## Testing

Test the integration with sample queries:
- "What will the weather be like in Perth next week?"
- "What are the fire risk conditions for tomorrow?"
- "Should we pre-position resources based on predicted conditions?"

## Monitoring

Set up monitoring for:
- API response times
- Error rates
- Usage metrics
- Cost tracking (especially important for AI API usage)

## Fallback Strategy

The current mock implementation serves as a fallback if AI services are unavailable. Consider implementing:
- Service health checks
- Automatic failover to backup AI services
- Cache frequently requested predictions

---

**Note**: This is currently running with mock responses. To activate real AI predictions, implement one of the options above and update your environment variables.
