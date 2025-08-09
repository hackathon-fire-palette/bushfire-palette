// Australian Bushfire Alert System - Mock Data & Logic

// Bushfire alert data (replace with real data as needed)
const alerts = [
  {
    id: 1,
    title: 'Bushfire Emergency Warning',
    location: 'Blue Mountains, NSW',
    severity: 'critical',
    summary: 'A fast-moving bushfire is threatening homes and lives. Leave immediately if safe to do so.',
    actions: 'Follow your bushfire survival plan. Leave now if not prepared. Stay tuned to emergency services.',
    coordinates: [-33.7, 150.3],
    updated: '2025-08-09 13:00',
  },
  {
    id: 2,
    title: 'Bushfire Watch and Act',
    location: 'Ballarat, VIC',
    severity: 'medium',
    summary: 'Conditions are changing. Monitor the situation and be ready to act.',
    actions: 'Prepare to leave. Keep informed via local radio and emergency services.',
    coordinates: [-37.6, 143.8],
    updated: '2025-08-09 12:30',
  },
  {
    id: 3,
    title: 'Bushfire Advice',
    location: 'Perth Hills, WA',
    severity: 'low',
    summary: 'Smoke may be visible. No immediate threat, but stay informed.',
    actions: 'Stay up to date. Review your bushfire plan.',
    coordinates: [-31.9, 116.1],
    updated: '2025-08-09 12:00',
  },
];

// Severity icon mapping for list and map
const severityIcons = {
  low: 'assets/advice-icon.svg',
  medium: 'assets/watch-icon.svg',
  critical: 'assets/emergency-icon.svg',
};

// Render alerts list on dashboard
function renderAlertsList() {
  const list = document.getElementById('alertsList');
  if (!list) return;
  list.innerHTML = alerts.map(alert => `
    <div class="alert-card alert-severity-${alert.severity}">
      <img src="${severityIcons[alert.severity]}" alt="${alert.severity} icon" class="alert-icon" />
      <div class="alert-info">
        <div class="alert-title">${alert.title}</div>
        <div class="alert-location">${alert.location}</div>
        <div class="alert-summary">${alert.summary}</div>
        <div class="alert-actions">${alert.actions}</div>
        <div class="alert-updated">Last updated: ${alert.updated}</div>
        <a href="alert.html?id=${alert.id}" class="alert-details-link">View Details</a>
      </div>
    </div>
  `).join('');
}

// Render alert details on alert.html
function renderAlertDetails() {
  const details = document.getElementById('alertDetails');
  if (!details) return;
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'), 10);
  const alert = alerts.find(a => a.id === id);
  if (!alert) {
    details.innerHTML = '<p>Alert not found.</p>';
    return;
  }
  details.innerHTML = `
    <div class="alert-card alert-severity-${alert.severity}">
      <img src="${severityIcons[alert.severity]}" alt="${alert.severity} icon" class="alert-icon" />
      <div class="alert-info">
        <div class="alert-title">${alert.title}</div>
        <div class="alert-location">${alert.location}</div>
        <div class="alert-summary">${alert.summary}</div>
        <div class="alert-actions">${alert.actions}</div>
        <div class="alert-updated">Last updated: ${alert.updated}</div>
        <a href="index.html">Back to Dashboard</a>
      </div>
    </div>
  `;
}


// Render Leaflet map with bush/forest region polygon and alert markers
function renderMap() {
  const mapDiv = document.getElementById('map');
  if (!mapDiv) return;
  // Remove any previous map instance
  if (mapDiv._leaflet_id) {
    mapDiv._leaflet_id = null;
    mapDiv.innerHTML = '';
  }
  // Center on Australia
  const map = L.map(mapDiv).setView([-25.2744, 133.7751], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Example polygon covering major bush/forest regions (rough demo, not accurate)
  const bushPolygonCoords = [
    [-10, 142], // Cape York
    [-17, 145],
    [-23, 150],
    [-28, 153], // SE QLD/NSW
    [-38, 146], // VIC
    [-42, 147], // TAS
    [-35, 138], // SA
    [-30, 122], // WA
    [-15, 125],
    [-10, 130],
    [-10, 142],
  ];
  L.polygon(bushPolygonCoords, {
    color: '#388e3c',
    fillColor: '#388e3c',
    fillOpacity: 0.25,
    weight: 2
  }).addTo(map);

  // Add alert markers
  alerts.forEach(alert => {
    const icon = L.icon({
      iconUrl: severityIcons[alert.severity],
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -35],
    });
    L.marker(alert.coordinates, { icon })
      .addTo(map)
      .bindPopup(
        `<b>${alert.title}</b><br>${alert.location}<br><span style='color:#b71c1c;font-weight:bold;'>${alert.severity.toUpperCase()}</span><br>${alert.summary}`
      );
  });
}

// Page routing
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
    renderAlertsList();
    setTimeout(renderMap, 0); // Ensure Leaflet is loaded
  } else if (window.location.pathname.endsWith('alert.html')) {
    renderAlertDetails();
  }
});
