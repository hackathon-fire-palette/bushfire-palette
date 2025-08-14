// Mock GeoJSON data for Digital Atlas bushfire boundaries
const mockDigitalAtlasData = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "DA001",
        "name": "Perth Hills Fire",
        "status": "Active",
        "area_km2": 50,
        "updated": "2025-08-14T12:00:00Z"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [116.0, -31.9],
          [116.1, -31.9],
          [116.1, -32.0],
          [116.0, -32.0],
          [116.0, -31.9]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "DA002",
        "name": "Margaret River Burn",
        "status": "Contained",
        "area_km2": 10,
        "updated": "2025-08-14T11:30:00Z"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [115.0, -33.9],
          [115.1, -33.9],
          [115.1, -34.0],
          [115.0, -34.0],
          [115.0, -33.9]
        ]]
      }
    }
  ]
};

// Mock GeoJSON data for NASA FIRMS fire hotspots
const mockFIRMSData = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "FIRMS001",
        "confidence": "high",
        "brightness": 320,
        "acq_date": "2025-08-14",
        "acq_time": "03:45",
        "instrument": "MODIS"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [116.05, -31.95]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "FIRMS002",
        "confidence": "nominal",
        "brightness": 300,
        "acq_date": "2025-08-14",
        "acq_time": "04:15",
        "instrument": "VIIRS"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [115.05, -33.95]
      }
    }
  ]
};

// Mock function to fetch Digital Atlas data
async function fetchDigitalAtlasData() {
  return new Promise(resolve => setTimeout(() => resolve(mockDigitalAtlasData), 500));
}

// Mock function to fetch NASA FIRMS data
async function fetchFIRMSData() {
  return new Promise(resolve => setTimeout(() => resolve(mockFIRMSData), 600));
}

// Mock function to fetch Predictive Risk Zone data (reusing existing structure)
async function fetchPredictiveRiskZoneData() {
  return new Promise(resolve => setTimeout(() => resolve({
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "id": "PRZ001",
          "risk_level": "High",
          "prediction_time": "2025-08-14T18:00:00Z"
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [116.02, -31.92],
            [116.12, -31.92],
            [116.12, -32.02],
            [116.02, -32.02],
            [116.02, -31.92]
          ]]
        }
      }
    ]
  }), 700));
}

// Severity icon mapping for list and map
const incidentIcons = {
  'bushfire': 'assets/icon-bushfire.svg',
  'burn off': 'assets/icon-burnoff.svg',
  'storm advice': 'assets/icon-storm.svg',
  'bushfire advice': 'assets/icon-advice.svg',
  'active alarm': 'assets/icon-alarm.svg',
  'road crash': 'assets/icon-roadcrash.svg',
};

const severityIcons = {
  low: 'assets/icon-advice.svg',
  medium: 'assets/icon-storm.svg',
  critical: 'assets/icon-alarm.svg',
};

let map;
let bushfireLayer, floodLayer, stormDamageLayer, heatwaveLayer, predictiveRiskLayer;
let bushfireCluster, floodCluster, stormDamageCluster, heatwaveCluster;

document.addEventListener('DOMContentLoaded', function() {
  // Initialize map
  map = L.map('hazardMap').setView([-25.2744, 133.7751], 4); // Center on Australia
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Initialize cluster groups for different hazard types
  bushfireCluster = L.markerClusterGroup();
  floodCluster = L.markerClusterGroup();
  stormDamageCluster = L.markerClusterGroup();
  heatwaveCluster = L.markerClusterGroup();

  // Add initial layers (bushfires checked by default)
  map.addLayer(bushfireCluster);

  // Load initial data
  loadHazardData().then(updateLegend); // Call updateLegend after data is loaded

  // Event listeners for toggles
  document.getElementById('toggleBushfires').addEventListener('change', toggleLayer);
  document.getElementById('toggleFloods').addEventListener('change', toggleLayer);
  document.getElementById('toggleStormDamage').addEventListener('change', toggleLayer);
  document.getElementById('toggleHeatwaveWarnings').addEventListener('change', toggleLayer);
  document.getElementById('togglePredictiveRisk').addEventListener('change', toggleLayer);

  // Find Me and Search functionality
  var findMeBtn = document.getElementById('findMeBtn');
  var searchInput = document.getElementById('locationSearchInput');

  if (findMeBtn) {
    findMeBtn.onclick = function() {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      findMeBtn.disabled = true;
      findMeBtn.textContent = 'Locating...';
      navigator.geolocation.getCurrentPosition(function(pos) {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        map.setView([lat, lng], 13);
        L.marker([lat, lng], {
          icon: L.divIcon({className:'',html:'<span style="font-size:1.5em;">📍</span>',iconAnchor:[12,32]})
        }).addTo(map).bindPopup('You are here').openPopup();
        findMeBtn.disabled = false;
        findMeBtn.textContent = '📍 Find Me';
      }, function() {
        alert('Unable to retrieve your location.');
        findMeBtn.disabled = false;
        findMeBtn.textContent = '📍 Find Me';
      });
    };
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var query = searchInput.value.trim();
        if (!query) return;
        fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query))
          .then(r => r.json())
          .then(results => {
            if (results && results.length > 0) {
              const lat = parseFloat(results[0].lat);
              const lon = parseFloat(results[0].lon);
              map.setView([lat, lon], 13);
              L.marker([lat, lon], {
                icon: L.divIcon({className:'',html:'<span style="font-size:1.5em;">🔎</span>',iconAnchor:[12,32]})
              }).addTo(map).bindPopup(results[0].display_name).openPopup();
            } else {
              alert('Location not found.');
            }
          })
          .catch(() => alert('Location search failed.'));
      }
    });
  }

  // Accessibility toggles (copied from index.html)
  document.getElementById('darkModeToggle').onclick = function() {
    document.body.classList.toggle('dark-mode');
    this.classList.toggle('active');
  };
  document.getElementById('contrastToggle').onclick = function() {
    document.body.classList.toggle('high-contrast');
    this.classList.toggle('active');
  };
  document.getElementById('languageSelect').onchange = function() {
    document.documentElement.lang = this.value;
  };
});

function updateLegend() {
  const legendContent = document.getElementById('legendContent');
  if (!legendContent) return;

  let html = '<h4>Hazard Types:</h4>';
  html += `<div><img src="${incidentIcons['bushfire']}" width="24" height="24" style="vertical-align:middle;"> Bushfires (Hotspots & Boundaries)</div>`;
  html += `<div><span style="display:inline-block;width:24px;height:24px;background:#e74c3c;border:1px solid #c0392b;vertical-align:middle;"></span> Bushfire Boundary</div>`;
  html += `<div><span style="font-size:1.5em;vertical-align:middle;">🌊</span> Floods</div>`;
  html += `<div><span style="font-size:1.5em;vertical-align:middle;">⛈️</span> Storm Damage</div>`;
  html += `<div><span style="font-size:1.5em;vertical-align:middle;">☀️</span> Heatwave Warnings</div>`;
  html += `<div><span style="display:inline-block;width:24px;height:24px;background:#f1c40f;border:1px solid #f39c12;vertical-align:middle;"></span> Predictive Risk Area</div>`;

  html += '<h4 style="margin-top:1em;">Severity Levels:</h4>';
  html += `<div><span style="display:inline-block;width:20px;height:10px;background:#c0392b;vertical-align:middle;"></span> Emergency (Immediate Threat)</div>`;
  html += `<div><span style="display:inline-block;width:20px;height:10px;background:#f39c12;vertical-align:middle;"></span> Watch and Act (High Alert)</div>`;
  html += `<div><span style="display:inline-block;width:20px;height:10px;background:#1976d2;vertical-align:middle;"></span> Advice (Monitor Conditions)</div>`;

  legendContent.innerHTML = html;
}

async function loadHazardData() {
  // Load Bushfire data (FIRMS hotspots and Digital Atlas boundaries)
  const firmsData = await fetchFIRMSData();
  firmsData.features.forEach(feature => {
    if (feature.geometry.type === 'Point') {
      const lat = feature.geometry.coordinates[1];
      const lng = feature.geometry.coordinates[0];
      const marker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: incidentIcons['bushfire'],
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -30],
        })
      }).bindPopup(`<b>Bushfire Hotspot</b><br>
        Confidence: ${feature.properties.confidence}<br>
        Brightness: ${feature.properties.brightness}<br>
        Date: ${feature.properties.acq_date} ${feature.properties.acq_time}`);
      bushfireCluster.addLayer(marker);
    }
  });

  const digitalAtlasData = await fetchDigitalAtlasData();
  digitalAtlasData.features.forEach(feature => {
    if (feature.geometry.type === 'Polygon') {
      const polygon = L.geoJSON(feature, {
        style: function(feature) {
          return {
            color: "#c0392b",
            weight: 2,
            opacity: 0.7,
            fillColor: "#e74c3c",
            fillOpacity: 0.3
          };
        },
        onEachFeature: function (feature, layer) {
          if (feature.properties && feature.properties.name) {
            layer.bindPopup(`<b>${feature.properties.name}</b><br>
              Status: ${feature.properties.status}<br>
              Area: ${feature.properties.area_km2} km²<br>
              Updated: ${new Date(feature.properties.updated).toLocaleString()}`);
          }
        }
      });
      bushfireCluster.addLayer(polygon); // Add polygons to the bushfire cluster as well
    }
  });

  // Load Predictive Risk Zones
  const predictiveRiskData = await fetchPredictiveRiskZoneData();
  predictiveRiskLayer = L.geoJSON(predictiveRiskData, {
    style: function(feature) {
      return {
        color: "#f39c12",
        weight: 2,
        opacity: 0.7,
        fillColor: "#f1c40f",
        fillOpacity: 0.2
      };
    },
    onEachFeature: function (feature, layer) {
      if (feature.properties && feature.properties.risk_level) {
        layer.bindPopup(`<b>Predicted Risk Zone</b><br>
          Risk Level: ${feature.properties.risk_level}<br>
          Prediction Time: ${new Date(feature.properties.prediction_time).toLocaleString()}`);
      }
    }
  });

  // Dummy data for other layers (Floods, Storm Damage, Heatwave Warnings)
  // These will be simple markers for now, can be expanded later
  const dummyFloodData = [
    { lat: -31.9, lng: 115.9, title: "Minor Flood Warning", details: "River levels rising." },
    { lat: -32.1, lng: 115.8, title: "Flood Watch", details: "Heavy rainfall expected." }
  ];
  dummyFloodData.forEach(data => {
    const marker = L.marker([data.lat, data.lng], {
      icon: L.divIcon({className:'',html:'<span style="font-size:1.5em;">🌊</span>',iconAnchor:[12,32]})
    }).bindPopup(`<b>${data.title}</b><br>${data.details}`);
    floodCluster.addLayer(marker);
  });

  const dummyStormData = [
    { lat: -31.95, lng: 115.85, title: "Severe Thunderstorm Warning", details: "Damaging winds and large hail." },
    { lat: -32.0, lng: 116.0, title: "Storm Damage Report", details: "Trees down, power outages." }
  ];
  dummyStormData.forEach(data => {
    const marker = L.marker([data.lat, data.lng], {
      icon: L.divIcon({className:'',html:'<span style="font-size:1.5em;">⛈️</span>',iconAnchor:[12,32]})
    }).bindPopup(`<b>${data.title}</b><br>${data.details}`);
    stormDamageCluster.addLayer(marker);
  });

  const dummyHeatwaveData = [
    { lat: -31.9, lng: 115.8, title: "Extreme Heatwave Warning", details: "Temperatures exceeding 40°C." },
    { lat: -32.0, lng: 115.9, title: "Heatwave Advice", details: "Stay hydrated, avoid direct sun." }
  ];
  dummyHeatwaveData.forEach(data => {
    const marker = L.marker([data.lat, data.lng], {
      icon: L.divIcon({className:'',html:'<span style="font-size:1.5em;">☀️</span>',iconAnchor:[12,32]})
    }).bindPopup(`<b>${data.title}</b><br>${data.details}`);
    heatwaveCluster.addLayer(marker);
  });
}

function toggleLayer(event) {
  const checkboxId = event.target.id;
  const isChecked = event.target.checked;

  switch (checkboxId) {
    case 'toggleBushfires':
      if (isChecked) {
        map.addLayer(bushfireCluster);
      } else {
        map.removeLayer(bushfireCluster);
      }
      break;
    case 'toggleFloods':
      if (isChecked) {
        map.addLayer(floodCluster);
      } else {
        map.removeLayer(floodCluster);
      }
      break;
    case 'toggleStormDamage':
      if (isChecked) {
        map.addLayer(stormDamageCluster);
      } else {
        map.removeLayer(stormDamageCluster);
      }
      break;
    case 'toggleHeatwaveWarnings':
      if (isChecked) {
        map.addLayer(heatwaveCluster);
      } else {
        map.removeLayer(heatwaveCluster);
      }
      break;
    case 'togglePredictiveRisk':
      if (isChecked) {
        map.addLayer(predictiveRiskLayer);
      } else {
        map.removeLayer(predictiveRiskLayer);
      }
      break;
  }
}
