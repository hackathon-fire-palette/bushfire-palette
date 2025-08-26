document.addEventListener('DOMContentLoaded', () => {
    // Simulate BehavePlus and FARSITE/FlamMap data
    function loadSimulatedFireData() {
        const behaveplusOutput = document.getElementById('behaveplus-output');
        const farsiteOutput = document.getElementById('farsite-output');

        // Simulate some fire behavior data
        const simulatedBehavePlusData = `
Fire Behavior Analysis (BehavePlus)
-----------------------------------
Fuel Model: GR1 (Short Grass)
Slope: 10%
Wind Speed: 15 km/h
Aspect: South
Rate of Spread: 5.2 m/min
Flame Length: 1.8 m
Fireline Intensity: 1500 kW/m
        `;

        const simulatedFarsiteData = `
Fire Spread Simulation (FARSITE/FlamMap)
----------------------------------------
Simulation Area: 1000 hectares
Ignition Point: Lat -33.86, Lon 151.20
Weather Stream: Custom (24 hours)
Fuel Moisture: Live 80%, Dead 5%
Predicted Fire Perimeter: [Complex Polygon Data]
Time to Containment: 48 hours (estimated)
        `;

        behaveplusOutput.textContent = simulatedBehavePlusData;
        farsiteOutput.textContent = simulatedFarsiteData;
    }

    // Simulate real-time weather data
    function loadRealtimeWeatherData() {
        const weatherLocation = document.getElementById('weather-location');
        const weatherTemp = document.getElementById('weather-temp');
        const weatherHumidity = document.getElementById('weather-humidity');
        const weatherWind = document.getElementById('weather-wind');
        const weatherCondition = document.getElementById('weather-condition');

        // In a real application, this would fetch data from a weather API
        // For now, we'll use simulated data
        const simulatedWeatherData = {
            location: 'Sydney, Australia',
            temperature: 28,
            humidity: 65,
            windSpeed: 20,
            condition: 'Clear with high fire danger'
        };

        weatherLocation.textContent = simulatedWeatherData.location;
        weatherTemp.textContent = simulatedWeatherData.temperature;
        weatherHumidity.textContent = simulatedWeatherData.humidity;
        weatherWind.textContent = simulatedWeatherData.windSpeed;
        weatherCondition.textContent = simulatedWeatherData.condition;
    }

    // Initial data load
    loadSimulatedFireData();
    loadRealtimeWeatherData();

    // Update weather data every 5 minutes (for demonstration)
    // setInterval(loadRealtimeWeatherData, 5 * 60 * 1000);
});
