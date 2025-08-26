// api/predict-incident.js

// Simple prediction models (in production, you'd load trained ML models)
class IncidentPredictor {
  constructor() {
    // Based on the sample data patterns
    this.incidentTypeWeights = {
      'False Alarm - System Initiated': 0.45,
      'Fire - Bushfire (sml)': 0.15,
      'Road Crash & Rescue': 0.12,
      'False Call - Good Intent': 0.10,
      'Fire - Structure': 0.08,
      'Fire - Other/Rubbish/Vehicle': 0.05,
      'Fire - Bushfire (lge)': 0.03,
      'Called Off - No Attendance': 0.02
    };

    this.hazardClassWeights = {
      'ESL Category 1': 0.40,
      'ESL Category 2': 0.15,
      'ESL Category 3': 0.05,
      'ESL Category 4': 0.25,
      'ESL Category 5': 0.15
    };

    this.regionRiskFactors = {
      'METRO NORTH EAST REGION': 1.2,
      'METRO SOUTH COASTAL REGION': 1.1,
      'METRO NORTH COASTAL REGION': 1.1,
      'KIMBERLEY REGION': 1.3,
      'SOUTH WEST REGION': 1.0,
      'GOLDFIELDS MIDLANDS REGION': 0.9,
      'GREAT SOUTHERN REGION': 0.8,
      'MIDWEST GASCOYNE REGION': 0.9
    };
  }

  predictIncidentType(features) {
    const { region, time, weather, propertyType, season } = features;
    
    let scores = { ...this.incidentTypeWeights };
    
    // Time-based adjustments
    const hour = parseInt(time?.split(':')[0] || 12);
    if (hour >= 6 && hour <= 18) {
      scores['False Alarm - System Initiated'] *= 1.3;
      scores['Road Crash & Rescue'] *= 1.4;
    } else {
      scores['Fire - Bushfire (sml)'] *= 0.7;
      scores['False Call - Good Intent'] *= 0.8;
    }

    // Weather adjustments
    if (weather === 'Clear') {
      scores['Fire - Bushfire (sml)'] *= 1.4;
      scores['Fire - Bushfire (lge)'] *= 1.3;
    } else if (weather === 'Rain') {
      scores['Fire - Bushfire (sml)'] *= 0.3;
      scores['Fire - Bushfire (lge)'] *= 0.2;
    }

    // Property type adjustments
    if (propertyType === 'Residential') {
      scores['False Alarm - System Initiated'] *= 1.2;
      scores['Fire - Structure'] *= 1.3;
    } else if (propertyType === 'Special') {
      scores['Road Crash & Rescue'] *= 1.5;
    }

    // Regional adjustments
    const regionFactor = this.regionRiskFactors[region] || 1.0;
    Object.keys(scores).forEach(key => {
      scores[key] *= regionFactor;
    });

    return this.sortPredictions(scores);
  }

  predictHazardClass(features) {
    const { incidentType, region, propertyType } = features;
    
    let scores = { ...this.hazardClassWeights };

    // Incident type influences hazard class
    if (incidentType?.includes('Bushfire (lge)')) {
      scores['ESL Category 4'] *= 2.0;
      scores['ESL Category 5'] *= 1.5;
    } else if (incidentType?.includes('Road Crash')) {
      scores['ESL Category 5'] *= 1.8;
      scores['ESL Category 1'] *= 1.3;
    } else if (incidentType?.includes('False Alarm')) {
      scores['ESL Category 1'] *= 2.0;
      scores['ESL Category 2'] *= 1.2;
    }

    return this.sortPredictions(scores);
  }

  predictResourceNeeds(features) {
    const { incidentType, hazardClass, propertyType } = features;
    
    let resources = {
      fireStations: 1,
      ambulances: 0,
      police: 0,
      specialEquipment: []
    };

    if (incidentType?.includes('Road Crash')) {
      resources.ambulances = Math.random() > 0.3 ? 1 : 2;
      resources.police = 1;
      resources.specialEquipment.push('Rescue Equipment');
    }

    if (incidentType?.includes('Fire - Structure')) {
      resources.fireStations = Math.random() > 0.5 ? 2 : 3;
      resources.specialEquipment.push('Ladder Truck', 'Water Tanker');
    }

    if (incidentType?.includes('Bushfire')) {
      resources.fireStations = hazardClass?.includes('Category 4') || hazardClass?.includes('Category 5') ? 3 : 2;
      resources.specialEquipment.push('Water Bomber', 'Bulldozer');
    }

    if (propertyType === 'Institutional') {
      resources.fireStations += 1;
    }

    return resources;
  }

  predictResponseTime(features) {
    const { region, incidentType, hazardClass, location } = features;
    
    let baseTime = 8; // minutes
    
    // Regional adjustments
    if (region?.includes('KIMBERLEY') || region?.includes('GOLDFIELDS')) {
      baseTime += 15; // Remote areas
    } else if (region?.includes('METRO')) {
      baseTime -= 2; // Urban areas
    }

    // Incident type adjustments
    if (incidentType?.includes('Road Crash')) {
      baseTime += 3; // Traffic considerations
    }

    // Add random variation (±3 minutes)
    const variation = (Math.random() - 0.5) * 6;
    
    return Math.max(3, Math.round(baseTime + variation));
  }

  sortPredictions(scores) {
    return Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type, score], index) => ({
        prediction: type,
        confidence: Math.min(0.95, Math.max(0.1, score * 0.8 + Math.random() * 0.2)),
        rank: index + 1
      }));
  }

  generateRiskAssessment(features) {
    const { weather, region, season, time } = features;
    
    let riskLevel = 'LOW';
    let factors = [];

    // Weather risk factors
    if (weather === 'Clear' && (season === 'summer' || season === 'spring')) {
      factors.push('High fire danger conditions');
      riskLevel = 'MODERATE';
    }

    // Regional risk factors
    if (region?.includes('KIMBERLEY')) {
      factors.push('Remote location - extended response time');
      riskLevel = riskLevel === 'LOW' ? 'MODERATE' : 'HIGH';
    }

    // Time-based risk factors
    const hour = parseInt(time?.split(':')[0] || 12);
    if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
      factors.push('Peak traffic hours');
    }

    return {
      level: riskLevel,
      factors,
      recommendation: this.getRiskRecommendation(riskLevel, factors)
    };
  }

  getRiskRecommendation(level, factors) {
    const recommendations = {
      'LOW': 'Standard response protocols apply',
      'MODERATE': 'Monitor conditions closely, prepare additional resources',
      'HIGH': 'Deploy additional resources, consider pre-positioning assets'
    };
    
    return recommendations[level];
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { features, predictionType = 'all' } = req.body;

    if (!features) {
      return res.status(400).json({ 
        error: 'Missing features. Required: region, time, weather, propertyType' 
      });
    }

    const predictor = new IncidentPredictor();
    const response = {
      timestamp: new Date().toISOString(),
      input: features,
      predictions: {}
    };

    // Perform requested predictions
    if (predictionType === 'all' || predictionType === 'incident_type') {
      response.predictions.incidentType = predictor.predictIncidentType(features);
    }

    if (predictionType === 'all' || predictionType === 'hazard_class') {
      response.predictions.hazardClass = predictor.predictHazardClass(features);
    }

    if (predictionType === 'all' || predictionType === 'resources') {
      response.predictions.resourceNeeds = predictor.predictResourceNeeds(features);
    }

    if (predictionType === 'all' || predictionType === 'response_time') {
      response.predictions.responseTime = {
        estimated_minutes: predictor.predictResponseTime(features),
        confidence: 0.75
      };
    }

    if (predictionType === 'all' || predictionType === 'risk') {
      response.predictions.riskAssessment = predictor.generateRiskAssessment(features);
    }

    // Add metadata
    response.metadata = {
      model_version: '1.0.0',
      data_source: 'WA DFES Incident Reports',
      prediction_method: 'Rule-based with statistical weights',
      disclaimer: 'Predictions are estimates based on historical patterns'
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ 
      error: 'Prediction failed', 
      message: error.message 
    });
  }
}

// Example usage and testing
export const exampleRequest = {
  features: {
    region: 'METRO NORTH EAST REGION',
    time: '14:30:00',
    weather: 'Clear',
    propertyType: 'Residential',
    season: 'summer',
    location: {
      suburb: 'BELMONT',
      postcode: '6103'
    }
  },
  predictionType: 'all'
};

// Deployment configuration for Vercel
export const config = {
  runtime: 'nodejs',
  regions: ['syd1'] // Australia regions
};