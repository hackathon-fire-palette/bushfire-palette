// --- Vehicle & Crew Tracking System ---
// Dummy data for vehicles and crew assignments
var vehicles = [
  { id: 1, callsign: 'DFES201', type: 'bushfire', status: 'active', location: [-33.7, 150.3], crew: [1, 2], lastCheckIn: '2025-08-09 13:10' },
  { id: 2, callsign: 'DFES305', type: 'burn off', status: 'standby', location: [-37.6, 143.8], crew: [3], lastCheckIn: '2025-08-09 12:55' },
  { id: 3, callsign: 'DFES112', type: 'road crash', status: 'out-of-service', location: [-31.9, 116.1], crew: [], lastCheckIn: '2025-08-09 11:40' },
];

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

// Bushfire alert data (replace with real data as needed)
const alerts = [
  {
    id: 1,
    title: 'Bushfire Emergency Warning',
    location: 'Blue Mountains, NSW',
    severity: 'critical',
    type: 'bushfire',
    summary: 'A fast-moving bushfire is threatening homes and lives. Leave immediately if safe to do so.',
    actions: 'Follow your bushfire survival plan. Leave now if not prepared. Stay tuned to emergency services.',
    coordinates: [-33.7, 150.3],
    updated: '2025-08-09 13:00',
  },
  {
    id: 2,
    title: 'Burn Off - Planned',
    location: 'Wagga Wagga, NSW',
    severity: 'low',
    type: 'burn off',
    summary: 'A planned burn off is scheduled in this area. Smoke may be visible.',
    actions: 'No action required. Stay informed.',
    coordinates: [-35.1, 147.4],
    updated: '2025-08-09 12:50',
  },
  {
    id: 3,
    title: 'Storm Advice',
    location: 'Mandurah, WA',
    severity: 'medium',
    type: 'storm advice',
    summary: 'Severe weather is expected. Prepare for possible power outages and flooding.',
    actions: 'Secure loose items and stay indoors during the storm.',
    coordinates: [-32.5, 115.7],
    updated: '2025-08-09 12:40',
  },
  {
    id: 4,
    title: 'Bushfire Advice',
    location: 'Perth Hills, WA',
    severity: 'low',
    type: 'bushfire advice',
    summary: 'Smoke may be visible. No immediate threat, but stay informed.',
    actions: 'Stay up to date. Review your bushfire plan.',
    coordinates: [-31.9, 116.1],
    updated: '2025-08-09 12:30',
  },
  {
    id: 5,
    title: 'Active Alarm',
    location: 'Adelaide CBD, SA',
    severity: 'critical',
    type: 'active alarm',
    summary: 'An active fire alarm has been triggered in a commercial building.',
    actions: 'Evacuate the building and follow emergency services instructions.',
    coordinates: [-34.9285, 138.6007],
    updated: '2025-08-09 12:20',
  },
  {
    id: 6,
    title: 'Road Crash',
    location: 'Pacific Hwy, NSW',
    severity: 'medium',
    type: 'road crash',
    summary: 'A multi-vehicle crash has occurred. Emergency services are on scene.',
    actions: 'Avoid the area and follow detour signs.',
    coordinates: [-33.2, 151.5],
    updated: '2025-08-09 12:10',
  },
];

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
  list.innerHTML = alerts.map((alert, idx) => {
    const iconUrl = incidentIcons[alert.type] || severityIcons[alert.severity] || 'assets/icon-advice.svg';
    return `
      <div class="alert-card alert-severity-${alert.severity} collapsed" data-alert-idx="${idx}">
        <img src="${iconUrl}" alt="${alert.severity} icon" class="alert-icon" />
        <div class="alert-info-collapsed">
          <div class="alert-title">${alert.title}</div>
        </div>
        <div class="alert-info-full">
          <div class="alert-title">${alert.title}</div>
          <div class="alert-location">${alert.location}</div>
          <div class="alert-summary">${alert.summary}</div>
          <div class="alert-actions">${alert.actions}</div>
          <div class="alert-updated">Last updated: ${alert.updated}</div>
          <a href="alert.html?id=${alert.id}" class="alert-details-link">View Details</a>
        </div>
      </div>
    `;
  }).join('');
  // Add click handlers for collapse/expand
  setTimeout(() => {
    const cards = list.querySelectorAll('.alert-card');
    cards.forEach(card => {
      card.addEventListener('click', function(e) {
        // Only expand/collapse if not clicking a link
        if (e.target.tagName === 'A') return;
        cards.forEach(c => c.classList.add('collapsed'));
        cards.forEach(c => c.classList.remove('expanded'));
        this.classList.remove('collapsed');
        this.classList.add('expanded');
      });
    });
    // Expand the first card by default
    if (cards[0]) {
      cards[0].classList.remove('collapsed');
      cards[0].classList.add('expanded');
    }
  }, 10);
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
  // Center on Perth, WA (zoomed in)
  const map = L.map(mapDiv).setView([-31.9505, 115.8605], 11);
  window.map = map; // Expose dashboard map for weather overlay
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  // Polygons for each state/territory (very rough, demo only)
  const statePolygons = [
    // Queensland (QLD)
    { name: 'Queensland', coords: [
      [-11, 142], [-13, 143], [-17, 144.5], [-21, 147], [-24, 150], [-27, 148], [-28, 145], [-25, 141], [-20, 139], [-15, 139], [-12, 140], [-11, 142]
    ], color: '#388e3c' },
    // New South Wales (NSW)
    { name: 'New South Wales', coords: [
      [-28, 153], [-29, 150], [-32, 148], [-34, 147], [-36, 149], [-37, 150], [-37, 147], [-35, 145], [-32, 146], [-29, 147], [-28, 153]
    ], color: '#1976d2' },
    // Victoria (VIC)
    { name: 'Victoria', coords: [
      [-37, 150], [-38, 146], [-38.5, 144], [-37.5, 142], [-36, 143], [-36, 146], [-37, 150]
    ], color: '#fbc02d' },
    // Tasmania (TAS)
    { name: 'Tasmania', coords: [
      [-42, 148], [-43, 147.5], [-43, 146.5], [-42, 146], [-41.5, 147], [-42, 148]
    ], color: '#b71c1c' },
    // South Australia (SA)
    { name: 'South Australia', coords: [
      [-26, 140], [-29, 138], [-32, 137], [-35, 138], [-36, 140], [-34, 141], [-30, 141], [-26, 140]
    ], color: '#8d6e63' },
    // Western Australia (WA) - expanded to cover Perth
    { name: 'Western Australia', coords: [
      [-14, 128], [-18, 126], [-25, 122], [-30, 123], [-33, 124], [-34, 126], [-34, 115], [-32, 115.5], [-31.5, 115.8], [-31, 116.2], [-29, 117], [-25, 129], [-20, 130], [-16, 130], [-14, 128]
    ], color: '#388e3c' },
    // Northern Territory (NT)
    { name: 'Northern Territory', coords: [
      [-11, 132], [-13, 131], [-16, 132], [-20, 134], [-23, 135], [-25, 133], [-23, 131], [-18, 130], [-13, 130], [-11, 132]
    ], color: '#ff9800' },
    // ACT (tiny, just a dot)
    { name: 'ACT', coords: [
      [-35.3, 149.1], [-35.4, 149.2], [-35.3, 149.2], [-35.3, 149.1]
    ], color: '#7b1fa2' }
  ];
  statePolygons.forEach(state => {
    L.polygon(state.coords, {
      color: state.color,
      fillColor: state.color,
      fillOpacity: 0.18,
      weight: 2
    }).addTo(map).bindPopup(state.name);
  });
  // Add alert markers
  alerts.forEach(alert => {
    const iconUrl = incidentIcons[alert.type] || severityIcons[alert.severity] || 'assets/icon-advice.svg';
    const icon = L.icon({
      iconUrl,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -35],
    });
    L.marker(alert.coordinates, { icon })
      .addTo(map)
      .bindPopup(
        `<b>${alert.title}</b><br>${alert.location}<br><span style='color:#b71c1c;font-weight:bold;'>${alert.severity ? alert.severity.toUpperCase() : ''}</span><br>${alert.summary}`
      );
  });
  setTimeout(() => { map.invalidateSize(); }, 200);
// Simulate live vehicle data updates every 10 seconds
if (window.location.pathname.endsWith('vehicle.html')) {
  setInterval(() => {
    // Simulate random vehicle movement and status change
    vehicles.forEach(v => {
      // Move location slightly
      v.location = [
        v.location[0] + (Math.random() - 0.5) * 0.02,
        v.location[1] + (Math.random() - 0.5) * 0.02
      ];
      // Randomly change status
      if (Math.random() < 0.2) {
        const statuses = ['active', 'standby', 'out-of-service'];
        v.status = statuses[Math.floor(Math.random() * statuses.length)];
      }
      // Update lastCheckIn
      v.lastCheckIn = new Date().toISOString().slice(0,16).replace('T',' ');
    });
    renderVehicleTrackingDashboard();
  }, 10000);
}

// (restore bushPolygonCoords assignment in renderMap, not here)

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
  } else if (window.location.pathname.endsWith('roster.html')) {
    renderRosterDashboard();
  } else if (window.location.pathname.endsWith('vehicle.html')) {
    renderVehicleTrackingDashboard();
  }
});
