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
export function runFireSpreadModel({ ignitionPoint, fuelMap, wind, humidity }) {
  console.log('Running CA fire spread model...');
  console.log('Inputs:', { ignitionPoint, fuelMap, wind, humidity });

  // This is a highly simplified placeholder.
  // A real CA model would involve:
  // 1. Discretizing the area into cells.
  // 2. Assigning fuel, elevation, and other properties to each cell.
  // 3. Defining rules for fire spread based on neighbors, wind, fuel, and humidity.
  // 4. Iterating through time steps to simulate spread.

  // For demonstration, we'll generate some dummy GeoJSON polygons.
  const baseLat = ignitionPoint.lat || -31.95;
  const baseLng = ignitionPoint.lng || 115.86;

  const predictions = [];
  const timeSteps = [5, 10, 30, 60]; // minutes

  timeSteps.forEach(minutes => {
    const spreadFactor = minutes / 60; // Scale spread based on time
    const latOffset = 0.01 * spreadFactor;
    const lngOffset = 0.01 * spreadFactor;

    // Simulate a simple outward spread, potentially influenced by wind direction
    // (very basic, not actual physics)
    let currentLat = baseLat;
    let currentLng = baseLng;

    // Adjust based on wind direction (simplified)
    if (wind.direction === 'N') currentLat += latOffset * 0.5;
    if (wind.direction === 'S') currentLat -= latOffset * 0.5;
    if (wind.direction === 'E') currentLng += lngOffset * 0.5;
    if (wind.direction === 'W') currentLng -= lngOffset * 0.5;

    const polygonCoords = [
      [currentLng - lngOffset, currentLat - latOffset],
      [currentLng + lngOffset, currentLat - latOffset],
      [currentLng + lngOffset, currentLat + latOffset],
      [currentLng - lngOffset, currentLat + latOffset],
      [currentLng - lngOffset, currentLat - latOffset], // Close the polygon
    ];

    predictions.push({
      time: `${minutes}m`,
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
          }
        }]
      }
    });
  });

  return predictions;
}
