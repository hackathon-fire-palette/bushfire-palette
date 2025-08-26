// --- Incident Trend Chart Logic ---
// Loads Chart.js and renders a line chart of incidents by date/type
function loadIncidentTrendChart() {
  // Load Chart.js if not loaded
  var chartInit = function() {
    fetchIncidentTrendData().then(({labels, datasets}) => {
      renderIncidentTrendChart(labels, datasets);
    });
  };
  if (!window.ChartLoaded) {
    document.addEventListener('ChartJSLoaded', chartInit, { once: true });
    var s = document.createElement('script');
    s.src = 'chartjs-loader.js';
    document.head.appendChild(s);
  } else {
    chartInit();
  }
}

async function fetchIncidentTrendData() {
  // Stream SSE and aggregate by date/typeOfIncident
  const url = '/api/stream-sse?page=2&limit=50';
  const response = await fetch(url);
  const reader = response.body.getReader();
  let decoder = new TextDecoder();
  let incidents = [];
  let buffer = '';
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, {stream:true});
    let parts = buffer.split('\n');
    buffer = parts.pop();
    for (let line of parts) {
      if (line.startsWith('data:')) {
        try {
          let obj = JSON.parse(line.slice(5));
          if (Array.isArray(obj)) incidents.push(...obj);
          else if (obj && typeof obj === 'object') incidents.push(obj);
        } catch(e) {}
      }
    }
  }
  // Group by date/typeOfIncident
  let byDateType = {};
  let allTypes = new Set();
  let allDates = new Set();
  incidents.forEach(i => {
    let d = (i.date || i.timestamp || i.createdAt || '').slice(0,10);
    let t = i.typeOfIncident || i.type || 'Unknown';
    if (!d) return;
    allTypes.add(t);
    allDates.add(d);
    byDateType[d] = byDateType[d] || {};
    byDateType[d][t] = (byDateType[d][t]||0)+1;
  });
  let sortedDates = Array.from(allDates).sort();
  let sortedTypes = Array.from(allTypes).sort();
  let datasets = sortedTypes.map((type, idx) => ({
    label: type,
    data: sortedDates.map(d => byDateType[d]?.[type]||0),
    borderColor: chartColor(idx),
    backgroundColor: chartColor(idx,0.2),
    fill: false,
    tension: 0.2
  }));
  return { labels: sortedDates, datasets };
}

function chartColor(idx, alpha) {
  // 8 distinct colors, fallback to random
  const colors = [
    '#c0392b','#1976d2','#27ae60','#f39c12','#8e44ad','#e67e22','#16a085','#34495e'
  ];
  let c = colors[idx%colors.length];
  if (alpha !== undefined) {
    // Convert hex to rgba
    let r = parseInt(c.slice(1,3),16),g=parseInt(c.slice(3,5),16),b=parseInt(c.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return c;
}

let incidentTrendChartInstance = null;
function renderIncidentTrendChart(labels, datasets) {
  var ctx = document.getElementById('incidentTrendChart').getContext('2d');
  if (incidentTrendChartInstance) incidentTrendChartInstance.destroy();
  incidentTrendChartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true, position: 'bottom' },
        title: { display: false }
      },
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { title: { display: true, text: 'Date' } },
        y: { title: { display: true, text: 'Number of Incidents' }, beginAtZero: true }
      }
    }
  });
}

// Auto-load chart on DOMContentLoaded if element exists
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('incidentTrendChart')) {
    loadIncidentTrendChart();
  }
});
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

// Render alerts list on dashboard
function getPriorityFromCategory(category) {
  if (category.includes('Emergency Warning')) return 'Critical';
  if (category.includes('Watch and Act')) return 'High';
  return 'Low'; // Default for Advice or other categories
}

function renderAlertsList() {
  // This function will now fetch real data from the local JSON file and integrate with the renderAlerts function in index.html
  fetch('data/rfs-incidents.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const processedAlerts = data.features.map(feature => {
        const props = feature.properties;
        const descriptionDoc = new DOMParser().parseFromString(props.description, 'text/html');
        const location = descriptionDoc.querySelector('strong:contains("LOCATION:")')?.nextSibling.textContent.trim() || 'N/A';
        const details = descriptionDoc.body.textContent.trim();

        return {
          title: props.title,
          level: props.category.includes('Emergency Warning') ? 'Emergency' : props.category.includes('Watch and Act') ? 'Watch and Act' : 'Advice',
          priority: getPriorityFromCategory(props.category),
          status: props.category.split(' - ')[1] || 'Unknown', // Extract status from category
          locationDesc: location,
          requiredResources: [], // Placeholder for now, could be derived from severity/priority
          updated: new Date(props.pubDate).getTime(),
          details: details,
          link: props.guid
        };
      });
      // Call the renderAlerts function defined in index.html
      if (typeof renderAlerts === 'function') {
        renderAlerts(processedAlerts);
      } else {
        console.error("renderAlerts function not found in index.html. Ensure script.js is loaded after index.html's inline script.");
      }
    })
    .catch(error => console.error('Error fetching RFS incidents:', error));
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

  // Temporarily remove RFS data fetching to check map initialization
  // fetch('/api/rfs-incidents.js')
  //   .then(response => response.json())
  //   .then(data => {
  //     L.geoJSON(data, {
  //       pointToLayer: function (feature, latlng) {
  //         const category = feature.properties.category;
  //         let iconUrl = 'assets/icon-bushfire.svg'; // Default icon
  //         if (category.includes('Fire')) {
  //           iconUrl = 'assets/icon-bushfire.svg';
  //         }
  //         const icon = L.icon({
  //           iconUrl: iconUrl,
  //           iconSize: [40, 40],
  //           iconAnchor: [20, 40],
  //           popupAnchor: [0, -35],
  //         });
  //         return L.marker(latlng, { icon: icon });
  //       },
  //       onEachFeature: function (feature, layer) {
  //         if (feature.properties && feature.properties.title) {
  //           layer.bindPopup(`<h3>${feature.properties.title}</h3><p><strong>Category:</strong> ${feature.properties.category}</p><div>${feature.properties.description}</div>`);
  //         }
  //       }
  //     }).addTo(map);
  //   });

  setTimeout(() => { map.invalidateSize(); }, 200);
}

// Page routing
document.addEventListener('DOMContentLoaded', function() {
  // Welcome Overlay Logic
  const welcomeOverlay = document.getElementById('welcomeOverlay');
  const getStartedBtn = document.getElementById('getStartedBtn');
  const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');

  if (welcomeOverlay && getStartedBtn && !hasSeenWelcome) {
    welcomeOverlay.style.display = 'flex'; // Show the overlay
    getStartedBtn.addEventListener('click', () => {
      welcomeOverlay.style.display = 'none'; // Hide the overlay
      localStorage.setItem('hasSeenWelcome', 'true'); // Set flag
    });
  } else if (welcomeOverlay) {
    welcomeOverlay.style.display = 'none'; // Ensure it's hidden if already seen
  }

  if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
    renderAlertsList();
    setTimeout(renderMap, 0); // Ensure Leaflet is loaded

    // Render a sample fire risk graph on load
    renderFireRiskGraph([
      { day: 'Mon', value: 20 },
      { day: 'Tue', value: 35 },
      { day: 'Wed', value: 50 },
      { day: 'Thu', value: 45 },
      { day: 'Fri', value: 60 },
      { day: 'Sat', value: 75 },
      { day: 'Sun', value: 80 }
    ]);
  } else if (window.location.pathname.endsWith('alert.html')) {
    renderAlertDetails();
  } else if (window.location.pathname.endsWith('roster.html')) {
    renderRosterDashboard();
  } else if (window.location.pathname.endsWith('vehicle.html')) {
    renderVehicleTrackingDashboard();
  }
});

// --- Medical Coordination Dashboard Logic ---
let medCoordTab = 0;
const medicalIncidents = [
  { id: 1, type: 'Injury', location: 'Near Bushfire A', priority: 'High', status: 'En Route', assigned: 'Ambulance 12', patients: 2, notes: 'Patient with smoke inhalation.' },
  { id: 2, type: 'Evacuation Support', location: 'Community Hall B', priority: 'Medium', status: 'On Scene', assigned: 'Ambulance 22', patients: 15, notes: 'Elderly and children requiring assistance.' },
  { id: 3, type: 'Heat Stroke', location: 'Sector C', priority: 'Low', status: 'Completed', assigned: 'Ambulance 33', patients: 1, notes: 'Minor heat exhaustion.' },
];

function showMedCoordTab(idx) {
  medCoordTab = idx;
  document.querySelectorAll('.med-coord-tabs button').forEach((btn, i) => btn.classList.toggle('active', i === idx));
  const content = document.getElementById('med-coord-content');

  if (idx === 0) {
    // Overview Tab
    content.innerHTML = `
      <h3>Overview</h3>
      <p>Summary of current medical operations.</p>
      <div style="display:flex;gap:1em;flex-wrap:wrap;">
        <div class="card" style="flex:1;min-width:150px;">
          <h4>Active Incidents</h4>
          <p style="font-size:2em;font-weight:bold;color:#c0392b;">${medicalIncidents.filter(i => i.status !== 'Completed').length}</p>
        </div>
        <div class="card" style="flex:1;min-width:150px;">
          <h4>Available Ambulances</h4>
          <p style="font-size:2em;font-weight:bold;color:#28a745;">${ambulances.filter(a => a.status === 'Available').length}</p>
        </div>
        <div class="card" style="flex:1;min-width:150px;">
          <h4>Patients Triaged</h4>
          <p style="font-size:2em;font-weight:bold;color:#3498db;">${medicalIncidents.reduce((sum, i) => sum + i.patients, 0)}</p>
        </div>
      </div>
      <h4 style="margin-top:1.5em;">Recent Activity Log</h4>
      <div style="max-height:150px;overflow-y:auto;border:1px solid #eee;padding:0.5em;background:#fafafa;">
        ${medicalIncidents.map(i => `
          <div style="margin-bottom:0.5em;font-size:0.9em;">
            <strong>Incident #${i.id}:</strong> ${i.type} at ${i.location} - Status: ${i.status}
          </div>
        `).join('')}
      </div>
    `;
  } else if (idx === 1) {
    // Incidents Tab
    content.innerHTML = `
      <h3>Medical Incidents</h3>
      <table class="roster-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Location</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned</th>
            <th>Patients</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${medicalIncidents.map(i => `
            <tr>
              <td>${i.id}</td>
              <td>${i.type}</td>
              <td>${i.location}</td>
              <td>${i.priority}</td>
              <td>${i.status}</td>
              <td>${i.assigned || '-'}</td>
              <td>${i.patients}</td>
              <td>
                <button onclick="viewIncidentDetails(${i.id})" class="med-action-btn">View</button>
                <button onclick="updateIncidentStatus(${i.id})" class="med-action-btn">Update</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <button onclick="addMedicalIncident()" class="med-action-btn primary-button" style="margin-top:1em;">+ Add New Incident</button>
    `;
  } else if (idx === 2) {
    // Resources Tab
    content.innerHTML = `
      <h3>Medical Resources</h3>
      <h4>Hospitals</h4>
      <table class="roster-table">
        <thead><tr><th>Name</th><th>Status</th><th>Capacity</th><th>ER Load</th></tr></thead>
        <tbody>
          ${hospitals.map(h => `
            <tr>
              <td>${h.name}</td>
              <td style="${hospitalStatusColor(h.status)}">${h.status}</td>
              <td>${h.capacity}%</td>
              <td>${h.erLoad}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <h4 style="margin-top:1.5em;">Ambulances</h4>
      <table class="roster-table">
        <thead><tr><th>Name</th><th>Status</th><th>Location</th></tr></thead>
        <tbody>
          ${ambulances.map(a => `
            <tr>
              <td>${a.name}</td>
              <td style="${ambulanceStatusColor(a.status)}">${a.status}</td>
              <td>${a.location.join(', ')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (idx === 3) {
    // Communication Tab
    content.innerHTML = `
      <h3>Communication Log</h3>
      <div style="max-height:200px;overflow-y:auto;border:1px solid #eee;padding:0.5em;background:#fafafa;">
        ${medIncidentMessages.map(m => `
          <div style="margin-bottom:0.5em;font-size:0.9em;">
            <strong>${m.sender}:</strong> ${m.text} <span style="color:#888;">(${timeAgo(m.ts)})</span>
          </div>
        `).join('')}
      </div>
      <input type="text" id="medCoordMsgInput" placeholder="Send message..." style="width:70%;margin-top:0.5em;" />
      <button onclick="sendMedCoordMessage()" class="med-action-btn">Send</button>
      <h4 style="margin-top:1.5em;">Quick Messages</h4>
      <div style="display:flex;flex-wrap:wrap;gap:0.5em;">
        <button class="med-action-btn" onclick="sendQuickMedCoordMessage('Requesting immediate medical assistance at incident site.')">Request Assistance</button>
        <button class="med-action-btn" onclick="sendQuickMedCoordMessage('All clear, incident resolved.')">All Clear</button>
        <button class="med-action-btn" onclick="sendQuickMedCoordMessage('Need status update from Ambulance 12.')">Status Update</button>
      </div>
    `;
  }
}

function viewIncidentDetails(id) {
  const incident = medicalIncidents.find(i => i.id === id);
  if (!incident) return;
  alert(`Incident Details:\nID: ${incident.id}\nType: ${incident.type}\nLocation: ${incident.location}\nPriority: ${incident.priority}\nStatus: ${incident.status}\nAssigned: ${incident.assigned}\nPatients: ${incident.patients}\nNotes: ${incident.notes}`);
}

function updateIncidentStatus(id) {
  const incident = medicalIncidents.find(i => i.id === id);
  if (!incident) return;
  const newStatus = prompt(`Update status for Incident #${id} (Current: ${incident.status}):`);
  if (newStatus) {
    incident.status = newStatus;
    showMedCoordTab(1); // Re-render incidents tab
  }
}

function addMedicalIncident() {
  const type = prompt('Enter incident type (e.g., Injury, Evacuation Support):');
  const location = prompt('Enter incident location:');
  const priority = prompt('Enter priority (High, Medium, Low):');
  const patients = parseInt(prompt('Enter number of patients:'));
  if (type && location && priority && !isNaN(patients)) {
    const newId = medicalIncidents.length > 0 ? Math.max(...medicalIncidents.map(i => i.id)) + 1 : 1;
    medicalIncidents.push({
      id: newId,
      type,
      location,
      priority,
      status: 'Pending',
      assigned: 'Unassigned',
      patients,
      notes: ''
    });
    showMedCoordTab(1); // Re-render incidents tab
  } else {
    alert('Invalid input for new incident.');
  }
}

function sendMedCoordMessage() {
  const inp = document.getElementById('medCoordMsgInput');
  const val = inp.value.trim();
  if (!val) return;
  medIncidentMessages.push({ sender: "Coordination", text: val, ts: Date.now() });
  inp.value = '';
  showMedCoordTab(3); // Re-render communication tab
}

function sendQuickMedCoordMessage(msg) {
  medIncidentMessages.push({ sender: "Coordination", text: msg, ts: Date.now() });
  showMedCoordTab(3); // Re-render communication tab
}

// Initial render of the medical coordination dashboard
document.addEventListener('DOMContentLoaded', () => {
  // Only show medical coordination dashboard if it exists
  if (document.querySelector('.medical-coordination-dashboard')) {
    showMedCoordTab(0);
  }
});
