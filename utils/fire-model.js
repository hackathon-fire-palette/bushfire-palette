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
  const timeSteps = [5, 10, 15]; // minutes for simulation intervals

  timeSteps.forEach(minutes => {
    // A very simplified spread model: radius increases with time, influenced by wind
    const baseSpreadRadiusKm = 0.5 * (minutes / 5); // 0.5 km radius for every 5 minutes
    const kmPerDegreeLat = 111; // Approx km per degree latitude
    const kmPerDegreeLng = 111 * Math.cos(baseLat * Math.PI / 180); // Approx km per degree longitude at this latitude

    let latSpread = baseSpreadRadiusKm / kmPerDegreeLat;
    let lngSpread = baseSpreadRadiusKm / kmPerDegreeLng;

    // Factor in wind speed and direction (simplified influence)
    // Wind direction is in degrees (0 = N, 90 = E, 180 = S, 270 = W)
    const windInfluenceFactor = wind.speed / 50; // Max influence at 50 km/h wind
    const windAngleRad = (wind.direction - 90) * Math.PI / 180; // Convert to radians, adjust for Leaflet's Y-axis (North is up)

    latSpread += latSpread * windInfluenceFactor * Math.sin(windAngleRad);
    lngSpread += lngSpread * windInfluenceFactor * Math.cos(windAngleRad);

    // Terrain and humidity could further modify spread, but are omitted for this basic example
    // e.g., if (terrain === 'hilly') spreadFactor *= 1.2;
    // e.g., if (humidity > 70) spreadFactor *= 0.8;

    const polygonCoords = [
      [baseLng - lngSpread, baseLat - latSpread],
      [baseLng + lngSpread, baseLat - latSpread],
      [baseLng + lngSpread, baseLat + latSpread],
      [baseLng - lngSpread, baseLat + latSpread],
      [baseLng - lngSpread, baseLat - latSpread], // Close the polygon
    ];

    predictions.push({
      time: `${minutes}m`,
      radius: `${baseSpreadRadiusKm.toFixed(1)} km`, // Store radius for tooltip
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
            terrain: fuelMap, // Using fuelMap as terrain for now
            estimatedRadius: `${baseSpreadRadiusKm.toFixed(1)} km`,
          }
        }]
      }
    });
  });

  return predictions;
}
