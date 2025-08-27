// utils/fire-model.js
// Placeholder for a simple Cellular Automata (CA) fire spread model.

/**
 * Simulates fire spread using a simple Cellular Automata model.
 * @param {object} options - Configuration for the simulation.
 * @param {{lat: number, lng: number}} options.ignitionPoint - The starting point of the fire.
 * @param {any} options.fuelMap - A representation of fuel types/density (e.g., a 2D array or GeoTIFF).
 * @param {{speed: number, direction: string}} options.wind - Wind speed and direction.
 * @param {number} options.humidity - Relative humidity.
 * @returns {Array<object>} An array of predicted fire polygons (GeoJSON FeatureCollections) at different time steps.
 */
// utils/fire-model.js
// Placeholder for a simple Cellular Automata (CA) fire spread model.

// Simplified fuel model parameters (inspired by Rothermel, but not a full implementation)
const fuelModels = {
  'grass': {
    fuelLoad: 0.5, // kg/m^2
    heatContent: 18000, // kJ/kg
    surfaceAreaToVolumeRatio: 5000, // 1/m
    moistureExtinction: 0.12, // fraction
  },
  'shrub': {
    fuelLoad: 1.5,
    heatContent: 19000,
    surfaceAreaToVolumeRatio: 2000,
    moistureExtinction: 0.20,
  },
  'forest': {
    fuelLoad: 3.0,
    heatContent: 20000,
    surfaceAreaToVolumeRatio: 1000,
    moistureExtinction: 0.25,
  },
  'flat': { // Defaulting 'flat' terrain to a grass-like fuel for simulation
    fuelLoad: 0.5,
    heatContent: 18000,
    surfaceAreaToVolumeRatio: 5000,
    moistureExtinction: 0.12,
  }
};

/**
 * Calculates a simplified Rate of Spread (ROS) based on Rothermel-like principles.
 * This is a highly simplified approximation and not a full Rothermel model.
 * @param {object} fuel - Fuel model parameters.
 * @param {number} windSpeed - Wind speed in km/h.
 * @param {number} humidity - Relative humidity in %.
 * @param {number} slope - Slope in degrees (0 for flat).
 * @returns {number} Rate of Spread in km/h.
 */
function calculateSimplifiedROS(fuel, windSpeed, humidity, slope) {
  // Convert wind speed to m/s for internal calculations (approx)
  const windSpeed_mps = windSpeed * 1000 / 3600;

  // Fuel moisture content (simplified from humidity)
  // Lower humidity means lower moisture, higher flammability
  const fuelMoisture = (100 - humidity) / 100 * 0.15; // Max 15% moisture at 0% humidity, 0% at 100% humidity
  if (fuelMoisture > fuel.moistureExtinction) {
    return 0; // Fire won't spread if too wet
  }

  // Wind factor (simplified)
  const windFactor = 1 + (windSpeed_mps * 0.2); // Linear increase with wind

  // Slope factor (simplified)
  const slopeFactor = 1 + (Math.sin(slope * Math.PI / 180) * 0.5); // Increase with uphill slope

  // Reaction intensity (simplified)
  const reactionIntensity = fuel.fuelLoad * fuel.heatContent * (1 - (fuelMoisture / fuel.moistureExtinction));

  // Propagating flux ratio (simplified)
  const propagatingFluxRatio = 0.1; // Placeholder

  // Rate of spread (simplified formula)
  let ros_mps = (reactionIntensity * propagatingFluxRatio) / (fuel.surfaceAreaToVolumeRatio * 1000) * windFactor * slopeFactor;

  // Convert ROS back to km/h
  let ros_kmph = ros_mps * 3.6;

  // Apply a minimum and maximum spread for realism
  ros_kmph = Math.max(0.1, Math.min(ros_kmph, 30)); // Min 0.1 km/h, Max 30 km/h

  return ros_kmph;
}


/**
 * Simulates fire spread using a simple Cellular Automata model.
 * @param {object} options - Configuration for the simulation.
 * @param {{lat: number, lng: number}} options.ignitionPoint - The starting point of the fire.
 * @param {string} options.fuelMap - A string representing fuel type (e.g., 'grass', 'shrub', 'forest', 'flat').
 * @param {{speed: number, direction: number}} options.wind - Wind speed in km/h and direction in degrees (0=N, 90=E, 180=S, 270=W).
 * @param {number} options.humidity - Relative humidity in %.
 * @param {number} options.terrainSlope - Terrain slope in degrees.
 * @returns {Array<object>} An array of predicted fire polygons (GeoJSON FeatureCollections) at different time steps.
 */
export function runFireSpreadModel({ ignitionPoint, fuelMap, wind, humidity, terrainSlope = 0 }) {
  console.log('Running enhanced fire spread model...');
  console.log('Inputs:', { ignitionPoint, fuelMap, wind, humidity, terrainSlope });

  const baseLat = ignitionPoint.lat || -31.95;
  const baseLng = ignitionPoint.lng || 115.86;

  const predictions = [];
  const timeSteps = [5, 10, 15]; // minutes for simulation intervals

  const selectedFuel = fuelModels[fuelMap] || fuelModels['flat'];

  timeSteps.forEach(minutes => {
    // Calculate ROS for the current conditions
    const ros_kmph = calculateSimplifiedROS(selectedFuel, wind.speed, humidity, terrainSlope);
    const spreadDistanceKm = (ros_kmph * minutes) / 60; // Distance spread in km for 'minutes' duration

    const kmPerDegreeLat = 111; // Approx km per degree latitude
    const kmPerDegreeLng = 111 * Math.cos(baseLat * Math.PI / 180); // Approx km per degree longitude at this latitude

    let latSpread = spreadDistanceKm / kmPerDegreeLat;
    let lngSpread = spreadDistanceKm / kmPerDegreeLng;

    // Factor in wind direction to bias the spread (wind blows *to* the direction)
    // Wind direction is in degrees (0 = N, 90 = E, 180 = S, 270 = W)
    // We want the fire to spread *with* the wind, so we use the wind direction directly
    const windAngleRad = (wind.direction) * Math.PI / 180;

    // Apply wind bias: increase spread in wind direction, decrease perpendicular
    const windBiasFactor = 0.5; // How much wind biases the spread (0 to 1)
    const windLatBias = latSpread * windBiasFactor * Math.cos(windAngleRad);
    const windLngBias = lngSpread * windBiasFactor * Math.sin(windAngleRad);

    // Create an elliptical spread pattern biased by wind
    // This is a very simplified ellipse, not a true fire ellipse
    const majorAxisLat = latSpread * (1 + windBiasFactor);
    const minorAxisLat = latSpread * (1 - windBiasFactor);
    const majorAxisLng = lngSpread * (1 + windBiasFactor);
    const minorAxisLng = lngSpread * (1 - windBiasFactor);

    const polygonCoords = [
      [baseLng - minorAxisLng + windLngBias, baseLat - majorAxisLat + windLatBias],
      [baseLng + majorAxisLng + windLngBias, baseLat - minorAxisLat + windLatBias],
      [baseLng + minorAxisLng + windLngBias, baseLat + majorAxisLat + windLatBias],
      [baseLng - majorAxisLng + windLngBias, baseLat + minorAxisLat + windLatBias],
      [baseLng - minorAxisLng + windLngBias, baseLat - majorAxisLat + windLatBias], // Close the polygon
    ];

    predictions.push({
      time: `${minutes}m`,
      radius: `${spreadDistanceKm.toFixed(1)} km`, // Store effective spread distance for tooltip
      geojson: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [polygonCoords] },
          properties: {
            time_to_impact: `0-${minutes}m`,
            windSpeed: wind.speed,
            windDirection: wind.direction,
            humidity: humidity,
            terrain: fuelMap,
            estimatedRadius: `${spreadDistanceKm.toFixed(1)} km`,
            rateOfSpread: `${ros_kmph.toFixed(2)} km/h`,
          }
        }]
      }
    });
