document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
    const map = L.map('map').setView([-31.9505, 115.8605], 10); // Centered around Perth, WA

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    let fireSpreadLayers = []; // To store and manage fire spread polygons

    // Function to load active fire data (from nasa-firms.js)
    async function loadActiveFireZones() {
        try {
            const response = await fetch('/api/nasa-firms.js');
            const fireData = await response.json();
            console.log('Active Fire Data:', fireData);

            fireData.forEach(fire => {
                L.circleMarker([fire.latitude, fire.longitude], {
                    radius: 8,
                    fillColor: '#ff0000',
                    color: '#000',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map)
                .bindPopup(`<b>Active Fire</b><br>Brightness: ${fire.brightness}<br>Confidence: ${fire.confidence}<br>Time: ${new Date(fire.timestamp).toLocaleString()}`);
            });

        } catch (error) {
            console.error('Error loading active fire zones:', error);
        }
    }

    // Function to simulate fire spread and display on map
    async function simulateFireSpread(originLat, originLon, windSpeed, windDirection, humidity, terrain) {
        try {
            const response = await fetch('/api/fire-spread-model.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ignitionPoint: { lat: originLat, lng: originLon },
                    fuelMap: terrain, // Using terrain as fuelMap for now
                    wind: { speed: windSpeed, direction: windDirection },
                    humidity: humidity,
                    terrainSlope: 5 // Example slope in degrees
                }),
            });
            const spreadData = await response.json();
            console.log('Fire Spread Simulation Data:', spreadData);

            // Clear previous spread layers
            fireSpreadLayers.forEach(layer => map.removeLayer(layer));
            fireSpreadLayers = [];

            if (spreadData.predictedPolygons && spreadData.predictedPolygons.length > 0) {
                spreadData.predictedPolygons.forEach((prediction, index) => {
                    const geojsonLayer = L.geoJSON(prediction.geojson, {
                        style: function (feature) {
                            return {
                                fillColor: `rgba(255, 100, 0, ${0.5 - (index * 0.1)})`, // Fading color
                                weight: 2,
                                opacity: 1,
                                color: 'white',
                                dashArray: '3',
                                fillOpacity: 0.7
                            };
                        },
                        onEachFeature: function (feature, layer) {
                            layer.bindPopup(`
                                <b>Estimated spread in ${prediction.time}: ${prediction.radius} radius</b><br>
                                Population at risk: ${Math.floor(Math.random() * 5000)}<br>
                                Suggested resources: ${Math.floor(Math.random() * 5) + 1} tankers, ${Math.floor(Math.random() * 20) + 5} personnel
                            `);
                            layer.on('click', async (e) => {
                                // Simulate fetching impact estimates
                                const impactResponse = await fetch(`/api/impact-assessment.js?jobId=${spreadData.jobId}`);
                                const impactData = await impactResponse.json();
                                console.log('Impact Assessment Data:', impactData);
                                // Update popup with more detailed impact data if needed
                                layer.setPopupContent(`
                                    <b>Estimated spread in ${prediction.time}: ${prediction.radius} radius</b><br>
                                    Population at risk: ${impactData.summary.populationExposed || 'N/A'}<br>
                                    Suggested resources: ${impactData.summary.parcelsAtRisk || 'N/A'} parcels at risk
                                `).openPopup();
                            });
                        }
                    }).addTo(map);
                    fireSpreadLayers.push(geojsonLayer);
                });
            }

        } catch (error) {
            console.error('Error simulating fire spread:', error);
        }
    }

    // Event listener for the "Show Fire Spread Zone" button
    document.getElementById('show-fire-spread-zone-button').addEventListener('click', () => {
        // For demonstration, let's use a hardcoded fire origin and environmental factors
        const originLat = -31.9505;
        const originLon = 115.8605;
        const windSpeed = 20; // km/h
        const windDirection = 270; // degrees (West)
        const humidity = 30; // %
        const terrain = 'flat'; // or 'hilly', 'mountainous'

        simulateFireSpread(originLat, originLon, windSpeed, windDirection, humidity, terrain);
    });

    // Initial data load
    loadActiveFireZones();
});
