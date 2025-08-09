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
    renderRosterDashboard();
  } else if (window.location.pathname.endsWith('alert.html')) {
    renderAlertDetails();
  }
});
