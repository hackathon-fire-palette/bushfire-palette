// --- Vehicle & Crew Tracking System ---
// Dummy data for vehicles and crew assignments
var vehicles = [
  { id: 1, callsign: 'DFES201', type: 'bushfire', status: 'active', location: [-33.7, 150.3], crew: [1, 2], lastCheckIn: '2025-08-09 13:10' },
  { id: 2, callsign: 'DFES305', type: 'burn off', status: 'standby', location: [-37.6, 143.8], crew: [3], lastCheckIn: '2025-08-09 12:55' },
  { id: 3, callsign: 'DFES112', type: 'road crash', status: 'out-of-service', location: [-31.9, 116.1], crew: [], lastCheckIn: '2025-08-09 11:40' },
];

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

function renderVehicleTrackingDashboard() {
  let html = '<div class="vehicle-map-container"><div id="vehicleMap" class="map-embed" style="height:350px;margin-bottom:1.5rem;"></div></div>';
  html += '<table class="roster-table" id="vehicleTable"><thead><tr><th>Callsign</th><th>Type</th><th>Status</th><th>Crew</th><th>Last Check-In</th></tr></thead><tbody>';
  vehicles.forEach((v, idx) => {
    const crewNames = v.crew.map(cid => {
      const p = (typeof personnel !== 'undefined') ? personnel.find(x => x.id === cid) : null;
      return p ? p.name : 'Unknown';
    }).join(', ') || '-';
    html += `<tr data-vid="${v.id}" tabindex="0"><td>${v.callsign}</td><td>${v.type}</td><td class=\"${v.status}\">${v.status.replace(/-/g,' ')}</td><td>${crewNames}</td><td>${v.lastCheckIn}</td></tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('vehicleTrackingDashboard').innerHTML = html;
  renderVehicleMap();
  // Interactivity: click row to focus marker
  setTimeout(() => {
    const table = document.getElementById('vehicleTable');
    if (!table || !window._vehicleMarkers) return;
    table.querySelectorAll('tbody tr').forEach(row => {
      row.addEventListener('click', function() {
        const vid = parseInt(this.getAttribute('data-vid'));
        const marker = window._vehicleMarkers[vid];
        if (marker) {
          marker.openPopup();
          marker._map.setView(marker.getLatLng(), 7, { animate: true });
        }
        table.querySelectorAll('tr').forEach(r => r.classList.remove('highlight'));
        this.classList.add('highlight');
      });
    });
  }, 300);
}

function renderVehicleMap() {
  const mapDiv = document.getElementById('vehicleMap');
  if (!mapDiv) return;
  if (mapDiv._leaflet_id) {
    mapDiv._leaflet_id = null;
    mapDiv.innerHTML = '';
  }
  const map = L.map(mapDiv).setView([-25.2744, 133.7751], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  // Fix for blank/grey tiles: force map to recalculate size after short delay
  setTimeout(() => { map.invalidateSize(); }, 200);
  // Vehicle markers
  vehicles.forEach(v => {
    // Use a more descriptive icon for each vehicle type
    let iconUrl = 'assets/fire_ban.png';
    if (v.type === 'bushfire') iconUrl = 'assets/icon-bushfire.svg';
    else if (v.type === 'burn off') iconUrl = 'assets/icon-burnoff.svg';
    else if (v.type === 'road crash') iconUrl = 'assets/icon-roadcrash.svg';
    else if (v.type === 'storm') iconUrl = 'assets/icon-storm.svg';
    // fallback to aus-map-placeholder.png if icon not found
    const icon = L.icon({
      iconUrl,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -30],
    });
    L.marker(v.location, { icon })
      .addTo(map)
      .bindPopup(`<b>${v.callsign}</b><br>Type: ${v.type}<br>Status: <span style='color:#b71c1c;font-weight:bold;'>${v.status.replace(/-/g,' ').toUpperCase()}</span><br>Crew: ${v.crew.map(cid => (typeof personnel !== 'undefined' ? (personnel.find(x => x.id === cid)?.name || 'Unknown') : 'Unknown')).join(', ') || '-'}`);
  });
}
// Australian Bushfire Alert System - Mock Data & Logic

// Severity icon mapping for list and map

// Custom icons for each incident type
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

// Render alerts list on dashboard
function renderAlertsList() {
  const list = document.getElementById('alertsList');
  if (!list) return;

  fetch('/api/rfs-incidents.js')
    .then(response => response.json())
    .then(data => {
      list.innerHTML = data.features.map((feature, idx) => {
        const props = feature.properties;
        const severity = props.category.includes('Emergency Warning') ? 'critical' : props.category.includes('Watch and Act') ? 'medium' : 'low';
        const iconUrl = incidentIcons['bushfire'] || severityIcons[severity] || 'assets/icon-advice.svg';
        
        // Extract details from description HTML
        const descriptionDoc = new DOMParser().parseFromString(props.description, 'text/html');
        const location = descriptionDoc.querySelector('strong:contains("LOCATION:")')?.nextSibling.textContent.trim() || 'N/A';
        const summary = descriptionDoc.body.textContent.split('LOCATION:')[0].trim(); // Basic summary extraction

        return `
          <div class="alert-card alert-severity-${severity} collapsed" data-alert-idx="${idx}">
            <img src="${iconUrl}" alt="${severity} icon" class="alert-icon" />
            <div class="alert-info-collapsed">
              <div class="alert-title">${props.title}</div>
            </div>
            <div class="alert-info-full">
              <div class="alert-title">${props.title}</div>
              <div class="alert-location">${location}</div>
              <div class="alert-summary">${summary}</div>
              <div class="alert-updated">Last updated: ${new Date(props.pubDate).toLocaleString()}</div>
              <a href="${props.guid}" target="_blank" class="alert-details-link">View Details on RFS</a>
            </div>
          </div>
        `;
      }).join('');

      // Add click handlers for collapse/expand
      setTimeout(() => {
        const cards = list.querySelectorAll('.alert-card');
        cards.forEach(card => {
          card.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') return;
            const isExpanded = this.classList.contains('expanded');
            cards.forEach(c => {
              c.classList.add('collapsed');
              c.classList.remove('expanded');
            });
            if (!isExpanded) {
              this.classList.remove('collapsed');
              this.classList.add('expanded');
            }
          });
        });
        // Expand the first card by default
        if (cards[0]) {
          cards[0].classList.remove('collapsed');
          cards[0].classList.add('expanded');
        }
      }, 10);
    });
}


// Interactive Roster Management System UI
// Dummy data in global variables for easy replacement
var personnel = [
  { id: 1, name: 'Alice Smith', role: 'Firefighter', skills: ['driver'], contact: 'alice@example.com', phone: '0400000001', availability: 'on-duty' },
  { id: 2, name: 'Bob Jones', role: 'Firefighter', skills: ['paramedic'], contact: 'bob@example.com', phone: '0400000002', availability: 'off-duty' },
  { id: 3, name: 'Carol Lee', role: 'Station Officer', skills: ['crew leader'], contact: 'carol@example.com', phone: '0400000003', availability: 'on-duty' },
  { id: 4, name: 'David Kim', role: 'Firefighter', skills: ['driver', 'paramedic'], contact: 'david@example.com', phone: '0400000004', availability: 'holiday' },
  { id: 5, name: 'Eve Brown', role: 'Firefighter', skills: [], contact: 'eve@example.com', phone: '0400000005', availability: 'sick' },
];
var roster = [
  { date: '2025-08-09', shift: 'Day', assigned: [1, 3], status: 'confirmed' },
  { date: '2025-08-09', shift: 'Night', assigned: [2, 4], status: 'pending' },
];
var leave = [
  { memberId: 4, start: '2025-08-08', end: '2025-08-12', reason: 'Holiday', approved: true },
  { memberId: 5, start: '2025-08-09', end: '2025-08-10', reason: 'Sick', approved: true },
];

function renderRosterDashboard() {
  // Today's date
  const today = '2025-08-09';
  const todayRoster = roster.filter(r => r.date === today);

  let html = '<h3>Today\'s Roster</h3>';
  html += '<table class="roster-table"><thead><tr><th>Shift</th><th>Assigned Members</th><th>Location</th><th>Emergency Contact</th><th>Availability</th><th>Status</th></tr></thead><tbody>';
  todayRoster.forEach(r => {
    const members = r.assigned.map(id => {
      const p = personnel.find(x => x.id === id);
      if (!p) return 'Unknown';
      return `${p.name} <span style=\"font-size:0.9em;color:#888;\">(${p.role})</span>`;
    }).join('<br>');
    // For demo, use first assigned member's info for location/contact/availability
    const first = personnel.find(x => x.id === r.assigned[0]);
    html += `<tr><td>${r.shift}</td><td>${members}</td><td>${first ? (first.location || 'Station') : '-'}</td><td>${first ? first.phone : '-'}</td><td class="${first ? first.availability : ''}">${first ? first.availability.replace('-', ' ') : '-'}</td><td class="${r.status}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</td></tr>`;
  });
  html += '</tbody></table>';

  html += '<h3>Personnel Availability</h3>';
  html += '<table class="roster-table"><thead><tr><th>Name</th><th>Role</th><th>Skills</th><th>Contact</th><th>Status</th><th>Edit</th></tr></thead><tbody>';
  personnel.forEach(p => {
    html += `<tr><td>${p.name}</td><td>${p.role}</td><td>${p.skills.join(', ') || '-'}</td><td>${p.contact}<br>${p.phone}</td><td class="${p.availability}">${p.availability.replace('-', ' ')}</td><td><select data-id="${p.id}" class="edit-availability"><option value="on-duty"${p.availability==='on-duty'?' selected':''}>On Duty</option><option value="off-duty"${p.availability==='off-duty'?' selected':''}>Off Duty</option><option value="holiday"${p.availability==='holiday'?' selected':''}>Holiday</option><option value="sick"${p.availability==='sick'?' selected':''}>Sick</option></select></td></tr>`;
  });
  html += '</tbody></table>';

  html += '<h3>Current Leave</h3>';
  html += '<ul class="leave-list">';
  leave.forEach((l, idx) => {
    const p = personnel.find(x => x.id === l.memberId);
    if (!p) return;
    html += `<li>${p.name} (${l.reason}) &mdash; ${l.start} to ${l.end} <button data-leave="${idx}" class="remove-leave">Remove</button></li>`;
  });
  html += '</ul>';

  // Add leave form
  html += '<h4>Add Leave</h4>';
  html += '<form id="addLeaveForm">';
  html += '<select id="leaveMember">' + personnel.map(p => `<option value="${p.id}">${p.name}</option>`).join('') + '</select> ';
  html += '<input type="date" id="leaveStart" required> to <input type="date" id="leaveEnd" required> ';
  html += '<input type="text" id="leaveReason" placeholder="Reason" required> ';
  html += '<button type="submit">Add Leave</button>';
  html += '</form>';

  document.getElementById('rosterDashboard').innerHTML = html;

  // Add interactivity
  document.querySelectorAll('.edit-availability').forEach(sel => {
    sel.addEventListener('change', function() {
      const id = parseInt(this.getAttribute('data-id'));
      const val = this.value;
      const p = personnel.find(x => x.id === id);
      if (p) p.availability = val;
      renderRosterDashboard();
    });
  });
  document.querySelectorAll('.remove-leave').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-leave'));
      leave.splice(idx, 1);
      renderRosterDashboard();
    });
  });
  document.getElementById('addLeaveForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const memberId = parseInt(document.getElementById('leaveMember').value);
    const start = document.getElementById('leaveStart').value;
    const end = document.getElementById('leaveEnd').value;
    const reason = document.getElementById('leaveReason').value;
    leave.push({ memberId, start, end, reason, approved: true });
    renderRosterDashboard();
  });
}


// Render Leaflet map with bush/forest region polygon and alert markers
function renderMap() {
  const mapDiv = document.getElementById('map');
  if (!mapDiv) return;
  if (mapDiv._leaflet_id) {
    mapDiv._leaflet_id = null;
    mapDiv.innerHTML = '';
  }
  // Center on NSW, where the RFS data is.
  const map = L.map(mapDiv).setView([-33.8688, 151.2093], 6);
  window.map = map; // Expose dashboard map for weather overlay
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  fetch('/api/rfs-incidents.js')
    .then(response => response.json())
    .then(data => {
      L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          const category = feature.properties.category;
          let iconUrl = 'assets/icon-bushfire.svg'; // Default icon
          if (category.includes('Fire')) {
            iconUrl = 'assets/icon-bushfire.svg';
          }
          const icon = L.icon({
            iconUrl: iconUrl,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -35],
          });
          return L.marker(latlng, { icon: icon });
        },
        onEachFeature: function (feature, layer) {
          if (feature.properties && feature.properties.title) {
            layer.bindPopup(`<h3>${feature.properties.title}</h3><p><strong>Category:</strong> ${feature.properties.category}</p><div>${feature.properties.description}</div>`);
          }
        }
      }).addTo(map);
    });

  setTimeout(() => { map.invalidateSize(); }, 200);
}

// Page routing
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
    renderAlertsList();
    setTimeout(renderMap, 0); // Ensure Leaflet is loaded
  } else if (window.location.pathname.endsWith('alert.html')) {
    renderAlertDetails();
  } else if (window.location.pathname.endsWith('roster.html')) {
    renderRosterDashboard();
  } else if (window.location.pathname.endsWith('vehicle.html')) {
    renderVehicleTrackingDashboard();
  }
});
