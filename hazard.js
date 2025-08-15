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

let timelineEvents = []; // Array to hold all timeline events
let currentTimelineDate = new Date(); // Current date for timeline view

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

  // Timeline event listeners
  document.getElementById('timelineNowBtn').addEventListener('click', () => setTimelineView('now'));
  document.getElementById('timelinePrev24Btn').addEventListener('click', () => setTimelineView('prev24'));
  document.getElementById('timelineNext24Btn').addEventListener('click', () => setTimelineView('next24'));

  document.getElementById('timelineFilterBushfires').addEventListener('change', renderTimeline);
  document.getElementById('timelineFilterFloods').addEventListener('change', renderTimeline);
  document.getElementById('timelineFilterStorms').addEventListener('change', renderTimeline);
  document.getElementById('timelineFilterHeatwaves').addEventListener('change', renderTimeline);

  // Initial render of timeline
  loadTimelineData().then(renderTimeline);
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

async function loadTimelineData() {
  // Fetch data from existing mock sources and transform for timeline
  const firmsData = await fetchFIRMSData();
  const digitalAtlasData = await fetchDigitalAtlasData();
  const predictiveRiskData = await fetchPredictiveRiskZoneData();

  // Clear previous events
  timelineEvents = [];

  // Process FIRMS data for timeline
  firmsData.features.forEach(feature => {
    if (feature.geometry.type === 'Point') {
      const timestamp = new Date(`${feature.properties.acq_date}T${feature.properties.acq_time.substring(0, 2)}:${feature.properties.acq_time.substring(2, 4)}:00`).getTime();
      timelineEvents.push({
        id: feature.properties.id,
        timestamp: timestamp,
        type: 'bushfire',
        severity: 'critical', // FIRMS are hotspots, so critical
        title: 'Bushfire Hotspot Detected',
        description: `Confidence: ${feature.properties.confidence}, Brightness: ${feature.properties.brightness}`,
        link: null // No direct link for FIRMS data in this mock
      });
    }
  });

  // Process Digital Atlas data for timeline
  digitalAtlasData.features.forEach(feature => {
    if (feature.geometry.type === 'Polygon') {
      const timestamp = new Date(feature.properties.updated).getTime();
      timelineEvents.push({
        id: feature.properties.id,
        timestamp: timestamp,
        type: 'bushfire',
        severity: feature.properties.status === 'Active' ? 'emergency' : 'advice',
        title: `Bushfire: ${feature.properties.name}`,
        description: `Status: ${feature.properties.status}, Area: ${feature.properties.area_km2} km²`,
        link: null // No direct link for Digital Atlas data in this mock
      });
    }
  });

  // Process Predictive Risk Data for timeline
  predictiveRiskData.features.forEach(feature => {
    if (feature.geometry.type === 'Polygon') {
      const timestamp = new Date(feature.properties.prediction_time).getTime();
      timelineEvents.push({
        id: feature.properties.id,
        timestamp: timestamp,
        type: 'predictive-risk',
        severity: feature.properties.risk_level === 'High' ? 'emergency' : 'advice',
        title: `Predicted Risk: ${feature.properties.risk_level}`,
        description: `Forecasted risk area.`,
        link: null
      });
    }
  });

  // Add dummy data for other hazard types for timeline
  const now = Date.now();
  const oneHour = 1000 * 60 * 60;
  const oneDay = oneHour * 24;

  // Floods
  timelineEvents.push({
    id: 'flood1', timestamp: now - oneHour * 5, type: 'flood', severity: 'medium',
    title: 'Minor Flood Warning Issued', description: 'River levels rising in Swan River.', link: '#'
  });
  timelineEvents.push({
    id: 'flood2', timestamp: now + oneHour * 10, type: 'flood', severity: 'medium',
    title: 'Flood Watch for Coastal Areas', description: 'Heavy rainfall expected in next 12 hours.', link: '#'
  });

  // Storms
  timelineEvents.push({
    id: 'storm1', timestamp: now - oneDay * 0.5, type: 'storm', severity: 'critical',
    title: 'Severe Thunderstorm Alert', description: 'Damaging winds and large hail reported.', link: '#'
  });
  timelineEvents.push({
    id: 'storm2', timestamp: now + oneDay * 1, type: 'storm', severity: 'low',
    title: 'Storm Damage Clean-up', description: 'Minor power outages and tree debris.', link: '#'
  });

  // Heatwaves
  timelineEvents.push({
    id: 'heatwave1', timestamp: now - oneDay * 1.5, type: 'heatwave', severity: 'critical',
    title: 'Extreme Heatwave Advisory', description: 'Temperatures exceeding 40°C for 3 days.', link: '#'
  });
  timelineEvents.push({
    id: 'heatwave2', timestamp: now + oneDay * 2, type: 'heatwave', severity: 'low',
    title: 'Heatwave Conditions Expected', description: 'Stay hydrated and avoid direct sun.', link: '#'
  });

  // Sort events by timestamp
  timelineEvents.sort((a, b) => a.timestamp - b.timestamp);
}

function renderTimeline() {
  const timelineContainer = document.getElementById('timeline');
  const timelineDetails = document.getElementById('timelineDetails');
  const filterBushfires = document.getElementById('timelineFilterBushfires').checked;
  const filterFloods = document.getElementById('timelineFilterFloods').checked;
  const filterStorms = document.getElementById('timelineFilterStorms').checked;
  const filterHeatwaves = document.getElementById('timelineFilterHeatwaves').checked;

  timelineContainer.innerHTML = '';
  timelineDetails.style.display = 'none'; // Hide details panel by default

  const filteredEvents = timelineEvents.filter(event => {
    if (event.type === 'bushfire' || event.type === 'predictive-risk') return filterBushfires;
    if (event.type === 'flood') return filterFloods;
    if (event.type === 'storm') return filterStorms;
    if (event.type === 'heatwave') return filterHeatwaves;
    return false;
  });

  // Calculate timeline width based on event spread (simple approach)
  if (filteredEvents.length === 0) {
    timelineContainer.style.width = '100%';
    timelineContainer.innerHTML = '<p style="text-align:center; width:100%;">No events to display for selected filters.</p>';
    return;
  }

  const minTime = filteredEvents[0].timestamp;
  const maxTime = filteredEvents[filteredEvents.length - 1].timestamp;
  const timeSpan = maxTime - minTime; // Total time span in milliseconds

  // Ensure a minimum width for scrollability, e.g., 2000px
  const baseWidth = 2000;
  let scaleFactor;
  if (timeSpan > 0) {
    scaleFactor = baseWidth / timeSpan;
  } else {
    // If all events have the same timestamp, distribute them evenly
    scaleFactor = 0; // Will be handled by event positioning logic below
  }

  timelineContainer.style.width = `${baseWidth}px`; // Set a fixed width for now

  filteredEvents.forEach((event, index) => {
    const eventElement = document.createElement('div');
    eventElement.className = `timeline-event timeline-event-${event.type} timeline-severity-${event.severity}`;
    
    let leftPosition;
    if (timeSpan > 0) {
      leftPosition = (event.timestamp - minTime) * scaleFactor;
    } else {
      // Distribute evenly if all events are at the same timestamp
      leftPosition = (baseWidth / (filteredEvents.length + 1)) * (index + 1);
    }
    
    eventElement.style.left = `${leftPosition}px`;
    eventElement.style.position = 'absolute'; // Enable absolute positioning

    // Icon for event
    let iconHtml = '';
    if (event.type === 'bushfire') iconHtml = `<img src="${incidentIcons['bushfire']}" width="24" height="24">`;
    else if (event.type === 'flood') iconHtml = `<span style="font-size:1.5em;">🌊</span>`;
    else if (event.type === 'storm') iconHtml = `<span style="font-size:1.5em;">⛈️</span>`;
    else if (event.type === 'heatwave') iconHtml = `<span style="font-size:1.5em;">☀️</span>`;
    else if (event.type === 'predictive-risk') iconHtml = `<span style="display:inline-block;width:24px;height:24px;background:#f1c40f;border:1px solid #f39c12;vertical-align:middle;"></span>`;

    eventElement.innerHTML = `
      <div class="timeline-marker">${iconHtml}</div>
      <div class="timeline-label">${event.title}</div>
    `;
    eventElement.title = `${event.title} (${new Date(event.timestamp).toLocaleString()})`; // Tooltip

    eventElement.addEventListener('click', () => showTimelineDetails(event));
    timelineContainer.appendChild(eventElement);
  });

  // Scroll to "Now" or current date
  scrollToCurrentTime();
}

function showTimelineDetails(event) {
  const timelineDetails = document.getElementById('timelineDetails');
  document.getElementById('timelineEventTitle').textContent = event.title;
  document.getElementById('timelineEventTime').textContent = new Date(event.timestamp).toLocaleString();
  document.getElementById('timelineEventDescription').textContent = event.description;
  const linkElement = document.getElementById('timelineEventLink');
  if (event.link) {
    linkElement.href = event.link;
    linkElement.style.display = 'inline';
  } else {
    linkElement.style.display = 'none';
  }
  timelineDetails.style.display = 'block';
}

function setTimelineView(view) {
  const now = new Date();
  if (view === 'now') {
    currentTimelineDate = now;
  } else if (view === 'prev24') {
    currentTimelineDate.setTime(currentTimelineDate.getTime() - (1000 * 60 * 60 * 24));
  } else if (view === 'next24') {
    currentTimelineDate.setTime(currentTimelineDate.getTime() + (1000 * 60 * 60 * 24));
  }
  scrollToCurrentTime();
}

function scrollToCurrentTime() {
  const timelineContainer = document.querySelector('.timeline-container');
  const timeline = document.getElementById('timeline');
  if (!timelineContainer || !timeline || timelineEvents.length === 0) return;

  const minTime = timelineEvents[0].timestamp;
  const maxTime = timelineEvents[timelineEvents.length - 1].timestamp;
  const timeSpan = maxTime - minTime;
  const scaleFactor = timeSpan > 0 ? timeline.offsetWidth / timeSpan : 0;

  const scrollPosition = (currentTimelineDate.getTime() - minTime) * scaleFactor - (timelineContainer.offsetWidth / 2);
  timelineContainer.scrollLeft = scrollPosition;
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
