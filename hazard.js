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

// Function to show/hide loading spinners
function showSpinner(spinnerId) {
  document.getElementById(spinnerId).style.display = 'block';
}

function hideSpinner(spinnerId) {
  document.getElementById(spinnerId).style.display = 'none';
}

// Severity icon mapping for list and map
const incidentIcons = {
  'bushfire': 'assets/icon-bushfire.svg',
  'burn off': 'assets/icon-burnoff.svg',
  'storm advice': 'assets/icon-storm.svg',
  'bushfire advice': 'assets/icon-advice.svg',
  'active alarm': 'assets/icon-alarm.svg',
  'road crash': 'assets/icon-roadcrash.svg',
  'watch and act': 'assets/watch-icon.svg', // Added Watch and Act icon
};

const severityIcons = {
  low: 'assets/icon-advice.svg',
  medium: 'assets/icon-storm.svg',
  critical: 'assets/icon-alarm.svg',
  'watch and act': 'assets/watch-icon.svg', // Added Watch and Act icon
};

let map;
let bushfireLayer, floodLayer, stormDamageLayer, heatwaveLayer, predictiveRiskLayer;
let bushfireCluster, floodCluster, stormDamageCluster, heatwaveCluster;

let timelineEvents = []; // Array to hold all timeline events
let currentTimelineDate = new Date(); // Current date for timeline view

let alertMap; // Separate map for the personalised alerts dashboard

document.addEventListener('DOMContentLoaded', function() {
  // Initialize main hazard map
  map = L.map('hazardMap').setView([-25.2744, 133.7751], 4); // Center on Australia
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Add scale control
  L.control.scale().addTo(map);

  // Add zoom control (default position is top-left, can be customized)
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Initialize cluster groups for different hazard types
  bushfireCluster = L.markerClusterGroup();
  floodCluster = L.markerClusterGroup();
  stormDamageCluster = L.markerClusterGroup();
  heatwaveCluster = L.markerClusterGroup();

  // Add initial layers (bushfires checked by default)
  map.addLayer(bushfireCluster);

  // Load initial data
  showSpinner('mapLoadingSpinner');
  loadHazardData().then(() => {
    updateLegend(); // Call updateLegend after data is loaded
    hideSpinner('mapLoadingSpinner');
  });

  // Set up real-time updates for hazard data
  const mapUpdateIntervalMinutes = 5;
  setInterval(() => {
    console.log(`Refreshing map hazard data...`);
    showSpinner('mapLoadingSpinner');
    loadHazardData().then(() => hideSpinner('mapLoadingSpinner'));
  }, mapUpdateIntervalMinutes * 60 * 1000);

  // Event listeners for toggles
  document.getElementById('toggleBushfires').addEventListener('change', toggleLayer);
  document.getElementById('toggleFloods').addEventListener('change', toggleLayer);
  document.getElementById('toggleStormDamage').addEventListener('change', toggleLayer);
  document.getElementById('toggleHeatwaveWarnings').addEventListener('change', toggleLayer);
  document.getElementById('togglePredictiveRisk').addEventListener('change', toggleLayer);

  // Main Map: Find Me and Search functionality
  const findMeBtn = document.getElementById('findMeBtn');
  const searchInput = document.getElementById('locationSearchInput');

  if (findMeBtn) {
    findMeBtn.onclick = function() {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      findMeBtn.disabled = true;
      findMeBtn.textContent = 'Locating...';
      showSpinner('mapLoadingSpinner');
      navigator.geolocation.getCurrentPosition(function(pos) {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        map.setView([lat, lng], 13);
        L.marker([lat, lng], {
          icon: L.divIcon({className:'',html:'<span style="font-size:1.5em;">📍</span>',iconAnchor:[12,32]})
        }).addTo(map).bindPopup('You are here').openPopup();
        findMeBtn.disabled = false;
        findMeBtn.textContent = '📍 Find Me';
        hideSpinner('mapLoadingSpinner');
      }, function() {
        alert('Unable to retrieve your location.');
        findMeBtn.disabled = false;
        findMeBtn.textContent = '📍 Find Me';
        hideSpinner('mapLoadingSpinner');
      });
    };
  }

  if (searchInput) {
    const autocompleteMain = new google.maps.places.Autocomplete(searchInput, {
      types: ['(regions)'],
      componentRestrictions: { 'country': 'au' }
    });

    autocompleteMain.addListener('place_changed', function() {
      const place = autocompleteMain.getPlace();
      if (!place.geometry) {
        alert("No details available for input: '" + place.name + "'");
        return;
      }
      showSpinner('mapLoadingSpinner');
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setView([place.geometry.location.lat(), place.geometry.location.lng()], 13);
      }
      L.marker([place.geometry.location.lat(), place.geometry.location.lng()], {
        icon: L.divIcon({className:'',html:'<span style="font-size:1.5em;">🔎</span>',iconAnchor:[12,32]})
      }).addTo(map).bindPopup(place.formatted_address).openPopup();
      hideSpinner('mapLoadingSpinner');
    });

    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    });
  }

  // Personalised Alerts: Location Entry Smart
  const alertLocationInput = document.getElementById('alertLocationInput');
  const alertFindMeBtn = document.getElementById('alertFindMeBtn');
  const selectedAlertLocation = document.getElementById('selectedAlertLocation');
  const dashboardMapDiv = document.getElementById('dashboardMap');

  if (alertLocationInput) {
    const autocompleteAlerts = new google.maps.places.Autocomplete(alertLocationInput, {
      types: ['(regions)'],
      componentRestrictions: { 'country': 'au' }
    });

    autocompleteAlerts.addListener('place_changed', function() {
      const place = autocompleteAlerts.getPlace();
      if (!place.geometry) {
        selectedAlertLocation.textContent = "Location: Invalid place selected.";
        return;
      }
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      selectedAlertLocation.textContent = `Location: ${place.formatted_address} (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`;
      
      // Initialize or update dashboard map
      if (!alertMap) {
        dashboardMapDiv.style.display = 'block';
        alertMap = L.map('dashboardMap').setView([lat, lng], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(alertMap);
      } else {
        alertMap.setView([lat, lng], 12);
      }
      // Clear existing markers and add a new one for the selected location
      alertMap.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
          alertMap.removeLayer(layer);
        }
      });
      L.marker([lat, lng], {
        icon: L.divIcon({className:'',html:'<span style="font-size:1.5em;">📍</span>',iconAnchor:[12,32]})
      }).addTo(alertMap).bindPopup(place.formatted_address).openPopup();

      // Trigger hazard data load for the new location
      showSpinner('dashboardLoadingSpinner');
      loadLocalHazardData(lat, lng).then(() => hideSpinner('dashboardLoadingSpinner'));
    });

    alertLocationInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    });
  }

  if (alertFindMeBtn) {
    alertFindMeBtn.onclick = function() {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      alertFindMeBtn.disabled = true;
      alertFindMeBtn.textContent = 'Locating...';
      navigator.geolocation.getCurrentPosition(function(pos) {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        selectedAlertLocation.textContent = `Location: Your Current Location (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`;
        
        // Initialize or update dashboard map
        if (!alertMap) {
          dashboardMapDiv.style.display = 'block';
          alertMap = L.map('dashboardMap').setView([lat, lng], 12);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(alertMap);
        } else {
          alertMap.setView([lat, lng], 12);
        }
        // Clear existing markers and add a new one for the current location
        alertMap.eachLayer(function (layer) {
          if (layer instanceof L.Marker) {
            alertMap.removeLayer(layer);
          }
        });
        L.marker([lat, lng], {
          icon: L.divIcon({className:'',html:'<span style="font-size:1.5em;">📍</span>',iconAnchor:[12,32]})
        }).addTo(alertMap).bindPopup('Your current location').openPopup();

        // Trigger hazard data load for the new location
        showSpinner('dashboardLoadingSpinner');
        loadLocalHazardData(lat, lng).then(() => hideSpinner('dashboardLoadingSpinner'));

        alertFindMeBtn.disabled = false;
        alertFindMeBtn.textContent = '📍 Use My Location';
      }, function() {
        alert('Unable to retrieve your location.');
        alertFindMeBtn.disabled = false;
        alertFindMeBtn.textContent = '📍 Use My Location';
        selectedAlertLocation.textContent = "Location: Failed to get current location.";
        hideSpinner('dashboardLoadingSpinner');
      });
    };
  }

  // Subscription form submission
  const alertSubscriptionForm = document.getElementById('alertSubscriptionForm');
  if (alertSubscriptionForm) {
    // Initialize toggle buttons
    document.querySelectorAll('#alertRiskLevelToggles .toggle-button').forEach(button => {
      button.addEventListener('click', function() {
        document.querySelectorAll('#alertRiskLevelToggles .toggle-button').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
      });
    });

    document.querySelectorAll('#specificHazardTypeToggles .toggle-button').forEach(button => {
      button.addEventListener('click', function() {
        this.classList.toggle('active');
      });
    });

    alertSubscriptionForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(alertSubscriptionForm);
      const preferences = {
        alertMethods: formData.getAll('alertMethod'),
        alertRiskLevel: document.querySelector('#alertRiskLevelToggles .toggle-button.active')?.dataset.value || 'all',
        specificHazardTypes: Array.from(document.querySelectorAll('#specificHazardTypeToggles .toggle-button.active')).map(btn => btn.dataset.value)
      };
      const locationText = selectedAlertLocation.textContent;
      
      // Show toast notification
      showToast('You\'re now subscribed!');

      // In a real application, you would send this data to a backend API
      console.log(`Subscription preferences for ${locationText}:\n${JSON.stringify(preferences, null, 2)}`);
    });
  }

  const testAlertBtn = document.getElementById('testAlertBtn');
  if (testAlertBtn) {
    testAlertBtn.addEventListener('click', function() {
      const locationText = selectedAlertLocation.textContent;
      alert(`Sending a test alert to your preferred methods for ${locationText}. (This is a demo. Actual alert delivery requires backend integration.)`);
    });
  }

  // Emergency Quick Actions
  document.querySelectorAll('.quick-action-btn').forEach(button => {
    button.addEventListener('click', function() {
      const actionText = this.textContent.trim();
      if (actionText.includes('evacuation centre')) {
        alert('Finding nearest evacuation centre... (This would link to a map/list)');
        // window.open('https://www.google.com/maps/search/evacuation+center+near+me', '_blank');
      } else if (actionText.includes('DFES emergency page')) {
        window.open('https://www.dfes.wa.gov.au/alerts/', '_blank');
      } else if (actionText.includes('emergency checklist')) {
        alert('Downloading emergency checklist... (This would trigger a PDF download)');
        // window.open('assets/emergency-checklist.pdf', '_blank'); // Assuming a PDF exists
      }
    });
  });

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

  // New Accessibility Toggles
  document.getElementById('colorBlindToggle').onclick = function() {
    document.body.classList.toggle('color-blind-mode');
    this.classList.toggle('active');
    showToast('Color-blind mode toggled.');
  };

  let currentFontSize = 1; // 1 = normal, 0.9 = small, 1.1 = large, 1.2 = xlarge
  const fontSizes = {
    'small': 0.9,
    'normal': 1.0,
    'large': 1.1,
    'xlarge': 1.2
  };
  const fontSizeClasses = ['font-size-small', 'font-size-large', 'font-size-xlarge'];

  function updateFontSizeClass() {
    document.body.classList.remove(...fontSizeClasses);
    if (currentFontSize === fontSizes.small) {
      document.body.classList.add('font-size-small');
    } else if (currentFontSize === fontSizes.large) {
      document.body.classList.add('font-size-large');
    } else if (currentFontSize === fontSizes.xlarge) {
      document.body.classList.add('font-size-xlarge');
    }
  }

  document.getElementById('decreaseFontSize').onclick = function() {
    if (currentFontSize === fontSizes.xlarge) currentFontSize = fontSizes.large;
    else if (currentFontSize === fontSizes.large) currentFontSize = fontSizes.normal;
    else if (currentFontSize === fontSizes.normal) currentFontSize = fontSizes.small;
    updateFontSizeClass();
    showToast('Font size decreased.');
  };

  document.getElementById('increaseFontSize').onclick = function() {
    if (currentFontSize === fontSizes.small) currentFontSize = fontSizes.normal;
    else if (currentFontSize === fontSizes.normal) currentFontSize = fontSizes.large;
    else if (currentFontSize === fontSizes.large) currentFontSize = fontSizes.xlarge;
    updateFontSizeClass();
    showToast('Font size increased.');
  };

  document.getElementById('voiceAlertToggle').onclick = function() {
    this.classList.toggle('active');
    if (this.classList.contains('active')) {
      showToast('Voice alerts enabled.');
      speakText('Voice alerts enabled.');
    } else {
      showToast('Voice alerts disabled.');
      speakText('Voice alerts disabled.');
    }
  };

  function speakText(text) {
    if ('speechSynthesis' in window && document.getElementById('voiceAlertToggle').classList.contains('active')) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }

  // Override showToast to also speak if voice alerts are enabled
  const originalShowToast = showToast;
  showToast = function(message, duration = 3000) {
    originalShowToast(message, duration);
    speakText(message);
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

  // Set default location for main map if no GPS or manual search
  if (!localStorage.getItem('mapInitialised')) {
    // Check if geolocation is available and try to use it first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(pos) {
        map.setView([pos.coords.latitude, pos.coords.longitude], 10);
        L.marker([pos.coords.latitude, pos.coords.longitude], {
          icon: L.divIcon({className:'',html:'<span style="font-size:1.5em;">📍</span>',iconAnchor:[12,32]})
        }).addTo(map).bindPopup('Your current location').openPopup();
        localStorage.setItem('mapInitialised', 'true');
      }, function() {
        // Geolocation failed or denied, default to Perth
        map.setView([-31.9505, 115.8605], 10); // Perth coordinates
        L.marker([-31.9505, 115.8605], {
          icon: L.divIcon({className:'',html:'<span style="font-size:1.5em;">📍</span>',iconAnchor:[12,32]})
        }).addTo(map).bindPopup('Default: Perth').openPopup();
        localStorage.setItem('mapInitialised', 'true');
      });
    } else {
      // Geolocation not supported, default to Perth
      map.setView([-31.9505, 115.8605], 10); // Perth coordinates
      L.marker([-31.9505, 115.8605], {
        icon: L.divIcon({className:'',html:'<span style="font-size:1.5em;">📍</span>',iconAnchor:[12,32]})
      }).addTo(map).bindPopup('Default: Perth').openPopup();
      localStorage.setItem('mapInitialised', 'true');
    }
  }

  // Community Safety Checklist: Accordion and Progress
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const accordionItem = this.closest('.accordion-item');
      const content = accordionItem.querySelector('.accordion-content');
      const icon = this.querySelector('.accordion-icon');

      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !isExpanded);
      content.style.display = isExpanded ? 'none' : 'block';
      icon.textContent = isExpanded ? '▼' : '▲';
    });
  });

  const checklistItems = document.querySelectorAll('.checklist-items input[type="checkbox"]');
  checklistItems.forEach(checkbox => {
    checkbox.addEventListener('change', updateChecklistProgress);
  });

  // Info icons for checklist items
  document.querySelectorAll('.checklist-items .info-icon').forEach(icon => {
    icon.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent checkbox from toggling
      const tip = this.closest('label').querySelector('input[type="checkbox"]').dataset.tip;
      if (tip) {
        alert(tip); // Simple alert for now, could be a custom tooltip
      }
    });
  });

  // Checklist action buttons
  document.getElementById('downloadChecklistPdf').addEventListener('click', function() {
    alert('Downloading checklist as PDF... (This feature requires a PDF generation library or server-side rendering.)');
    // Example: Generate PDF using jsPDF or similar library
    // const { jsPDF } = window.jspdf;
    // const doc = new jsPDF();
    // doc.text("My Emergency Checklist", 10, 10);
    // // Add checklist items
    // doc.save("emergency_checklist.pdf");
  });

  document.getElementById('emailChecklist').addEventListener('click', function() {
    alert('Emailing checklist summary... (This feature requires backend integration for sending emails.)');
    // Example: Collect data and send via fetch API to a backend endpoint
    // const checklistData = getChecklistProgress();
    // fetch('/api/email-checklist', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(checklistData)
    // });
  });

  document.getElementById('saveChecklistProgress').addEventListener('click', saveChecklistProgress);
  document.getElementById('loadChecklistProgress').addEventListener('click', loadChecklistProgress);

  // Initial load of checklist progress
  loadChecklistProgress();
  updateChecklistProgress(); // Update progress bar on load

  // Medical Coordination Section Logic
  let medicalMap;
  let medicalMapMarkers = L.featureGroup(); // Layer for incidents on medicalIncidentMap

  // Initialize Medical Incident Map
  const medicalIncidentMapDiv = document.getElementById('medicalIncidentMap');
  if (medicalIncidentMapDiv) {
    medicalMap = L.map('medicalIncidentMap').setView([-25.2744, 133.7751], 4); // Center on Australia
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(medicalMap);
    medicalMapMarkers.addTo(medicalMap);
    loadMedicalIncidentData(); // Load initial medical incident data
  }

  // Handle Medical Action Buttons
  document.querySelectorAll('.med-action-btn').forEach(button => {
    button.addEventListener('click', function() {
      const action = this.dataset.action;
      handleMedicalAction(action);
    });
  });

  // Incident Progress Tracker
  const incidentProgressTracker = document.getElementById('incidentProgressTracker');
  if (incidentProgressTracker) {
    let currentStepIndex = 0;
    const steps = Array.from(incidentProgressTracker.querySelectorAll('.step'));

    function updateProgressTracker() {
      steps.forEach((step, index) => {
        if (index < currentStepIndex) {
          step.classList.add('completed');
          step.classList.remove('active');
        } else if (index === currentStepIndex) {
          step.classList.add('active');
          step.classList.remove('completed');
        } else {
          step.classList.remove('active', 'completed');
        }
      });
    }

    document.querySelector('.med-action-btn[data-action="next-status"]').addEventListener('click', () => {
      if (currentStepIndex < steps.length - 1) {
        currentStepIndex++;
        updateProgressTracker();
        showToast(`Incident status advanced to: ${steps[currentStepIndex].textContent}`);
      } else {
        showToast('Incident is already completed!');
      }
    });
    updateProgressTracker(); // Initial update
  }

  // Triage Support
  const triageLevelSelect = document.getElementById('triageLevel');
  if (triageLevelSelect) {
    document.querySelector('.med-action-btn[data-action="apply-triage"]').addEventListener('click', () => {
      const selectedTriage = triageLevelSelect.value;
      showToast(`Triage level applied: ${selectedTriage.charAt(0).toUpperCase() + selectedTriage.slice(1)}`);
      console.log(`Applying triage: ${selectedTriage}`);
    });
  }

  // Offline Mode Toggle
  document.querySelector('.med-action-btn[data-action="toggle-offline"]').addEventListener('click', function() {
    const isOffline = this.textContent.includes('Disable');
    if (isOffline) {
      this.textContent = 'Enable Offline Mode';
      showToast('Offline Mode Disabled. Data will sync automatically.');
      console.log('Offline mode disabled.');
    } else {
      this.textContent = 'Disable Offline Mode';
      showToast('Offline Mode Enabled. Data will be cached and synced later.');
      console.log('Offline mode enabled.');
    }
  });

  // Generate Incident Report PDF
  document.querySelector('.med-action-btn[data-action="generate-report"]').addEventListener('click', () => {
    showToast('Generating Incident Report PDF... (Requires PDF generation library)');
    console.log('Generating PDF report.');
    // In a real application, you would use a library like jsPDF or send a request to a backend
    // Example: window.open('path/to/generated_report.pdf', '_blank');
  });

}); // End DOMContentLoaded

function updateChecklistProgress() {
  const checklistItems = document.querySelectorAll('.checklist-items input[type="checkbox"]');
  const totalItems = checklistItems.length;
  const completedItems = Array.from(checklistItems).filter(checkbox => checkbox.checked).length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const progressBar = document.getElementById('checklistProgressBar');
  progressBar.style.width = `${progress.toFixed(0)}%`;
  progressBar.textContent = `${completedItems} of ${totalItems} items done - ${progress.toFixed(0)}% complete`;
}

function saveChecklistProgress() {
  const checklistItems = document.querySelectorAll('.checklist-items input[type="checkbox"]');
  const progress = {};
  checklistItems.forEach((checkbox, index) => {
    progress[index] = checkbox.checked;
  });
  localStorage.setItem('bushfireChecklistProgress', JSON.stringify(progress));
  alert('Checklist progress saved locally!');
}

function loadChecklistProgress() {
  const savedProgress = localStorage.getItem('bushfireChecklistProgress');
  if (savedProgress) {
    const progress = JSON.parse(savedProgress);
    const checklistItems = document.querySelectorAll('.checklist-items input[type="checkbox"]');
    checklistItems.forEach((checkbox, index) => {
      if (progress[index] !== undefined) {
        checkbox.checked = progress[index];
      }
    });
    updateChecklistProgress();
    alert('Checklist progress loaded!');
  } else {
    alert('No saved checklist progress found.');
  }
}

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
  html += `<div><img src="${severityIcons['critical']}" width="24" height="24" style="vertical-align:middle;"> Emergency (Immediate Threat)</div>`;
  html += `<div><img src="${severityIcons['watch and act']}" width="24" height="24" style="vertical-align:middle;"> Watch and Act (High Alert)</div>`;
  html += `<div><img src="${severityIcons['low']}" width="24" height="24" style="vertical-align:middle;"> Advice (Monitor Conditions)</div>`;

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
      icon: L.divIcon({className:'flood-icon',html:'<span style="font-size:1.5em; color: #1976d2;">🌊</span>',iconAnchor:[12,32]})
    }).bindPopup(`<b>${data.title}</b><br>${data.details}`);
    floodCluster.addLayer(marker);
  });

  const dummyStormData = [
    { lat: -31.95, lng: 115.85, title: "Severe Thunderstorm Warning", details: "Damaging winds and large hail." },
    { lat: -32.0, lng: 116.0, title: "Storm Damage Report", details: "Trees down, power outages." }
  ];
  dummyStormData.forEach(data => {
    const marker = L.marker([data.lat, data.lng], {
      icon: L.divIcon({className:'storm-icon',html:'<span style="font-size:1.5em; color: #6a1b9a;">⛈️</span>',iconAnchor:[12,32]})
    }).bindPopup(`<b>${data.title}</b><br>${data.details}`);
    stormDamageCluster.addLayer(marker);
  });

  const dummyHeatwaveData = [
    { lat: -31.9, lng: 115.8, title: "Extreme Heatwave Warning", details: "Temperatures exceeding 40°C." },
    { lat: -32.0, lng: 115.9, title: "Heatwave Advice", details: "Stay hydrated, avoid direct sun." }
  ];
  dummyHeatwaveData.forEach(data => {
    const marker = L.marker([data.lat, data.lng], {
      icon: L.divIcon({className:'heatwave-icon',html:'<span style="font-size:1.5em; color: #ff8f00;">☀️</span>',iconAnchor:[12,32]})
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

// Function to calculate distance between two lat/lng points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Function to calculate bearing/direction
function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => deg * Math.PI / 180;
  const toDeg = (rad) => rad * 180 / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  const bearing = (toDeg(θ) + 360) % 360; // in degrees
  
  if (bearing >= 337.5 || bearing < 22.5) return 'N';
  else if (bearing >= 22.5 && bearing < 67.5) return 'NE';
  else if (bearing >= 67.5 && bearing < 112.5) return 'E';
  else if (bearing >= 112.5 && bearing < 157.5) return 'SE';
  else if (bearing >= 157.5 && bearing < 202.5) return 'S';
  else if (bearing >= 202.5 && bearing < 247.5) return 'SW';
  else if (bearing >= 247.5 && bearing < 292.5) return 'W';
  else if (bearing >= 292.5 && bearing < 337.5) return 'NW';
  return '';
}

// Function to get color based on hazard status/severity
function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case 'emergency': return '#c0392b'; // Red
    case 'watch and act': return '#f39c12'; // Orange
    case 'advice': return '#1976d2'; // Blue
    case 'active': return '#c0392b'; // Red for active incidents
    case 'contained': return '#28a745'; // Green for contained
    default: return '#6c757d'; // Grey
  }
}

let currentAlertLocation = null; // To store the lat/lng of the selected alert location
let alertMapMarkers = L.featureGroup(); // Layer for incidents on alertMap

async function loadLocalHazardData(lat, lng) {
  currentAlertLocation = { lat, lng };
  const dashboardStatus = document.getElementById('dashboardStatus');
  const activeIncidentsList = document.getElementById('activeIncidentsList');
  const dashboardMapDiv = document.getElementById('dashboardMap');

  dashboardStatus.textContent = 'Loading hazards for your location...';
  activeIncidentsList.innerHTML = '';
  alertMapMarkers.clearLayers(); // Clear existing markers on alert map

  // Show the map if it's not already visible
  dashboardMapDiv.style.display = 'block';

  const radiusKm = 50; // Incidents within 50 km radius

  try {
    const [firmsData, digitalAtlasData, predictiveRiskData] = await Promise.all([
      fetchFIRMSData(),
      fetchDigitalAtlasData(),
      fetchPredictiveRiskZoneData()
    ]);

    let incidents = [];

    // Process FIRMS data
    firmsData.features.forEach(feature => {
      if (feature.geometry.type === 'Point') {
        const incidentLat = feature.geometry.coordinates[1];
        const incidentLng = feature.geometry.coordinates[0];
        const distance = calculateDistance(lat, lng, incidentLat, incidentLng);
        if (distance <= radiusKm) {
          incidents.push({
            type: 'Bushfire Hotspot',
            status: 'Emergency', // FIRMS are critical
            distance: distance.toFixed(1),
            direction: calculateBearing(lat, lng, incidentLat, incidentLng),
            name: `Hotspot (Confidence: ${feature.properties.confidence})`,
            coords: [incidentLat, incidentLng],
            icon: incidentIcons['bushfire']
          });
        }
      }
    });

    // Process Digital Atlas data
    digitalAtlasData.features.forEach(feature => {
      if (feature.geometry.type === 'Polygon') {
        // For polygons, use the centroid or a representative point for distance calculation
        const bounds = L.geoJSON(feature).getBounds();
        const incidentLat = bounds.getCenter().lat;
        const incidentLng = bounds.getCenter().lng;
        const distance = calculateDistance(lat, lng, incidentLat, incidentLng);
        if (distance <= radiusKm) {
          incidents.push({
            type: 'Bushfire Boundary',
            status: feature.properties.status,
            distance: distance.toFixed(1),
            direction: calculateBearing(lat, lng, incidentLat, incidentLng),
            name: feature.properties.name,
            coords: [incidentLat, incidentLng], // Store centroid for marker
            geoJson: feature.geometry // Store full geometry for polygon on map
          });
        }
      }
    });

    // Process Predictive Risk Data
    predictiveRiskData.features.forEach(feature => {
      if (feature.geometry.type === 'Polygon') {
        const bounds = L.geoJSON(feature).getBounds();
        const incidentLat = bounds.getCenter().lat;
        const incidentLng = bounds.getCenter().lng;
        const distance = calculateDistance(lat, lng, incidentLat, incidentLng);
        if (distance <= radiusKm) {
          incidents.push({
            type: 'Predictive Risk Area',
            status: feature.properties.risk_level,
            distance: distance.toFixed(1),
            direction: calculateBearing(lat, lng, incidentLat, incidentLng),
            name: `Predicted Risk: ${feature.properties.risk_level}`,
            coords: [incidentLat, incidentLng],
            geoJson: feature.geometry
          });
        }
      }
    });

    // Add dummy data for other hazard types (Floods, Storm Damage, Heatwave Warnings)
    // Filter these based on proximity as well
    const dummyFloodData = [
      { lat: -31.9, lng: 115.9, title: "Minor Flood Warning", status: "Advice", icon: '🌊' },
      { lat: -32.1, lng: 115.8, title: "Flood Watch", status: "Watch and Act", icon: '🌊' }
    ];
    dummyFloodData.forEach(data => {
      const distance = calculateDistance(lat, lng, data.lat, data.lng);
      if (distance <= radiusKm) {
        incidents.push({
          type: 'Flood',
          status: data.status,
          distance: distance.toFixed(1),
          direction: calculateBearing(lat, lng, data.lat, data.lng),
          name: data.title,
          coords: [data.lat, data.lng],
          icon: data.icon
        });
      }
    });

    const dummyStormData = [
      { lat: -31.95, lng: 115.85, title: "Severe Thunderstorm Warning", status: "Emergency", icon: '⛈️' },
      { lat: -32.0, lng: 116.0, title: "Storm Damage Report", status: "Advice", icon: '⛈️' }
    ];
    dummyStormData.forEach(data => {
      const distance = calculateDistance(lat, lng, data.lat, data.lng);
      if (distance <= radiusKm) {
        incidents.push({
          type: 'Storm',
          status: data.status,
          distance: distance.toFixed(1),
          direction: calculateBearing(lat, lng, data.lat, data.lng),
          name: data.title,
          coords: [data.lat, data.lng],
          icon: data.icon
        });
      }
    });

    const dummyHeatwaveData = [
      { lat: -31.9, lng: 115.8, title: "Extreme Heatwave Warning", status: "Emergency", icon: '☀️' },
      { lat: -32.0, lng: 115.9, title: "Heatwave Advice", status: "Advice", icon: '☀️' }
    ];
    dummyHeatwaveData.forEach(data => {
      const distance = calculateDistance(lat, lng, data.lat, data.lng);
      if (distance <= radiusKm) {
        incidents.push({
          type: 'Heatwave',
          status: data.status,
          distance: distance.toFixed(1),
          direction: calculateBearing(lat, lng, data.lat, data.lng),
          name: data.title,
          coords: [data.lat, data.lng],
          icon: data.icon
        });
      }
    });

    if (incidents.length > 0) {
      dashboardStatus.textContent = `Active incidents within ${radiusKm} km of your location:`;
      incidents.sort((a, b) => a.distance - b.distance); // Sort by distance

      incidents.forEach(incident => {
        const incidentDiv = document.createElement('div');
        incidentDiv.style.marginBottom = '0.5em';
        incidentDiv.style.padding = '0.5em';
        incidentDiv.style.borderLeft = `5px solid ${getStatusColor(incident.status)}`;
        incidentDiv.style.backgroundColor = `rgba(${parseInt(getStatusColor(incident.status).slice(1,3), 16)}, ${parseInt(getStatusColor(incident.status).slice(3,5), 16)}, ${parseInt(getStatusColor(incident.status).slice(5,7), 16)}, 0.1)`;
        incidentDiv.innerHTML = `
          <strong>${incident.name}</strong> (${incident.type})<br>
          Status: <span style="font-weight:bold; color:${getStatusColor(incident.status)};">${incident.status}</span><br>
          Distance: ${incident.distance} km ${incident.direction} from your location
        `;
        activeIncidentsList.appendChild(incidentDiv);

        // Add to alertMap
        if (incident.geoJson) {
          L.geoJSON(incident.geoJson, {
            style: function(feature) {
              return {
                color: getStatusColor(incident.status),
                weight: 2,
                opacity: 0.7,
                fillColor: getStatusColor(incident.status),
                fillOpacity: 0.3
              };
            },
            onEachFeature: function (feature, layer) {
              layer.bindPopup(`<b>${incident.name}</b><br>Status: ${incident.status}<br>Distance: ${incident.distance} km ${incident.direction}`);
            }
          }).addTo(alertMapMarkers);
        } else {
          L.marker(incident.coords, {
            icon: incident.icon.startsWith('assets/') ? L.icon({
              iconUrl: incident.icon,
              iconSize: [36, 36],
              iconAnchor: [18, 36],
              popupAnchor: [0, -30],
            }) : L.divIcon({className:'',html:`<span style="font-size:1.5em;">${incident.icon}</span>`,iconAnchor:[12,32]})
          }).addTo(alertMapMarkers).bindPopup(`<b>${incident.name}</b><br>Status: ${incident.status}<br>Distance: ${incident.distance} km ${incident.direction}`);
        }
      });
      alertMapMarkers.addTo(alertMap);
      alertMap.fitBounds(alertMapMarkers.getBounds().isValid() ? alertMapMarkers.getBounds() : L.latLngBounds([lat, lng], [lat, lng]).pad(0.1)); // Adjust map view to fit markers
    } else {
      dashboardStatus.textContent = `No active incidents found within ${radiusKm} km of your location.`;
      activeIncidentsList.innerHTML = '<p>All clear! No major hazards reported in your vicinity.</p>';
    }

  } catch (error) {
    console.error('Error loading local hazard data:', error);
    dashboardStatus.textContent = 'Error loading hazard data. Please try again later.';
    activeIncidentsList.innerHTML = '';
  }
}

// Set up background updater for local hazard data
let hazardUpdateInterval;
const updateIntervalMinutes = 5; // Update every 5 minutes

function startHazardUpdater() {
  if (hazardUpdateInterval) clearInterval(hazardUpdateInterval); // Clear any existing interval
  hazardUpdateInterval = setInterval(() => {
    if (currentAlertLocation) {
      console.log(`Refreshing hazard data for ${currentAlertLocation.lat}, ${currentAlertLocation.lng}...`);
      showSpinner('dashboardLoadingSpinner');
      loadLocalHazardData(currentAlertLocation.lat, currentAlertLocation.lng).then(() => hideSpinner('dashboardLoadingSpinner'));
    }
  }, updateIntervalMinutes * 60 * 1000);
  console.log(`Hazard data will refresh every ${updateIntervalMinutes} minutes.`);
}

  // Start the updater when the page loads (if a location is set, or after user sets one)
  // For now, we'll start it after the initial DOMContentLoaded, but it will only fetch
  // data once a location is set by the user.
  startHazardUpdater();

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
          showToast('App is now available offline!');
        })
        .catch(err => {
          console.log('ServiceWorker registration failed: ', err);
          showToast('Offline mode not available.');
        });
    });
  }

  // Function to show toast notifications
  function showToast(message, duration = 3000) {
    const toast = document.getElementById('toastNotification');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
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
  const totalTimelineWidth = timeline.scrollWidth; // Use scrollWidth for actual content width

  // Calculate the position of the current date relative to the timeline's total time span
  let positionRatio;
  if (maxTime === minTime) { // Handle case where all events are at the same timestamp
    positionRatio = 0.5; // Center if only one point in time
  } else {
    positionRatio = (currentTimelineDate.getTime() - minTime) / (maxTime - minTime);
  }

  // Calculate the scroll position to center the current date
  const scrollPosition = (totalTimelineWidth * positionRatio) - (timelineContainer.offsetWidth / 2);

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
// --- Last fire in the news (UI -> API -> render) ---
const fireForm = document.getElementById('fireNewsForm');
const fireInput = document.getElementById('fireNewsLocation');
const fireBox   = document.getElementById('fireNewsResult');

async function fetchLastFireNews(location) {
  const url = `/api/last-fire-news?location=${encodeURIComponent(location)}&country=AU&lang=en`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('news fetch failed');
  return r.json();
}

function renderFireNews(resp) {
  fireBox.style.display = 'block';
  const { ok, item, error, near } = resp || {};
  if (!ok || !item) {
    fireBox.innerHTML = `<strong>No recent bushfire news found for “${near || fireInput.value}”.</strong>` +
                        (error ? `<div style="opacity:.7">${error}</div>` : '');
    return;
  }
  const dt = new Date(item.publishedAt).toLocaleString();
  fireBox.innerHTML = `
    <div style="font-weight:600; margin-bottom:6px;">Last reported fire near <em>${item.near}</em></div>
    <div style="margin:6px 0;"><a href="${item.link}" target="_blank" rel="noopener">${item.title}</a></div>
    <div style="opacity:.8">${item.source || 'News'} • ${dt}</div>
    ${item.snippet ? `<div style="margin-top:8px">${item.snippet}</div>` : ''}
  `;
}

fireForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const loc = fireInput.value.trim();
  if (!loc) return;
  fireBox.style.display = 'block';
  fireBox.textContent = 'Searching…';
  try {
    const data = await fetchLastFireNews(loc);
    renderFireNews(data);
  } catch (err) {
    renderFireNews({ ok:false, error:String(err) });
  }
});

// Medical Coordination Specific Functions
const medicalIncidentData = [
  { id: 'med001', lat: -31.9505, lng: 115.8605, type: 'Bushfire Injury', status: 'On Scene', team: 'Alpha', time: Date.now() - 3600000 }, // 1 hour ago
  { id: 'med002', lat: -32.0, lng: 116.0, type: 'Smoke Inhalation', status: 'En Route', team: 'Bravo', time: Date.now() - 1800000 }, // 30 mins ago
  { id: 'med003', lat: -32.1, lng: 115.9, type: 'Heat Exhaustion', status: 'Pending', team: 'Charlie', time: Date.now() - 600000 }, // 10 mins ago
  { id: 'med004', lat: -31.8, lng: 115.7, type: 'Minor Burn', status: 'Completed', team: 'Delta', time: Date.now() - 7200000 }, // 2 hours ago
];

const medicalResources = {
  responders: [
    { id: 'resp001', name: 'Dr. Smith', lat: -31.95, lng: 115.85, status: 'Available', type: 'Doctor' },
    { id: 'resp002', name: 'Paramedic Jones', lat: -32.0, lng: 115.9, status: 'In Use', type: 'Paramedic' },
    { id: 'resp003', name: 'Nurse Kelly', lat: -31.9, lng: 115.95, status: 'Available', type: 'Nurse' },
  ],
  hospitals: [
    { id: 'hosp001', name: 'Perth General Hospital', lat: -31.95, lng: 115.85, status: 'Available', capacity: 80 },
    { id: 'hosp002', name: 'Fremantle Community Hospital', lat: -32.05, lng: 115.75, status: 'Limited Capacity', capacity: 30 },
  ],
  equipment: [
    { id: 'eq001', name: 'Ambulance 1', lat: -31.96, lng: 115.87, status: 'In Use', type: 'Vehicle' },
    { id: 'eq002', name: 'Defibrillator 1', lat: -31.95, lng: 115.85, status: 'Available', type: 'Medical Device' },
  ]
};

async function loadMedicalIncidentData() {
  medicalMapMarkers.clearLayers(); // Clear existing markers

  // Add incidents
  medicalIncidentData.forEach(incident => {
    let iconHtml;
    let color;
    switch (incident.status) {
      case 'Pending': iconHtml = '🟡'; color = '#f1c40f'; break;
      case 'En Route': iconHtml = '🔵'; color = '#3498db'; break;
      case 'On Scene': iconHtml = '🟠'; color = '#e67e22'; break;
      case 'Completed': iconHtml = '🟢'; color = '#2ecc71'; break;
      default: iconHtml = '⚪'; color = '#ccc';
    }

    const marker = L.marker([incident.lat, incident.lng], {
      icon: L.divIcon({
        className: 'medical-incident-icon',
        html: `<span style="font-size:1.8em; color:${color};">${iconHtml}</span>`,
        iconAnchor: [12, 32]
      })
    }).bindPopup(`<b>Incident: ${incident.type}</b><br>Status: ${incident.status}<br>Team: ${incident.team}<br>Time: ${new Date(incident.time).toLocaleTimeString()}`);
    medicalMapMarkers.addLayer(marker);
  });

  // Add responders
  medicalResources.responders.forEach(responder => {
    let iconHtml = '👨‍⚕️'; // Default icon
    let statusBadge = `<span style="background-color: ${getMedicalStatusColor(responder.status)}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.7em;">${responder.status}</span>`;
    const marker = L.marker([responder.lat, responder.lng], {
      icon: L.divIcon({
        className: 'medical-resource-icon',
        html: `<span style="font-size:1.5em;">${iconHtml}</span>`,
        iconAnchor: [12, 32]
      })
    }).bindPopup(`<b>Responder: ${responder.name}</b><br>Type: ${responder.type}<br>Status: ${statusBadge}`);
    medicalMapMarkers.addLayer(marker);
  });

  // Add hospitals
  medicalResources.hospitals.forEach(hospital => {
    let iconHtml = '🏥';
    let statusBadge = `<span style="background-color: ${getMedicalStatusColor(hospital.status)}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.7em;">${hospital.status}</span>`;
    const marker = L.marker([hospital.lat, hospital.lng], {
      icon: L.divIcon({
        className: 'medical-resource-icon',
        html: `<span style="font-size:1.5em;">${iconHtml}</span>`,
        iconAnchor: [12, 32]
      })
    }).bindPopup(`<b>Hospital: ${hospital.name}</b><br>Status: ${statusBadge}<br>Capacity: ${hospital.capacity}%`);
    medicalMapMarkers.addLayer(marker);
  });

  // Add equipment
  medicalResources.equipment.forEach(item => {
    let iconHtml = '🚑'; // Default for vehicles
    if (item.type === 'Medical Device') iconHtml = '🩺';
    let statusBadge = `<span style="background-color: ${getMedicalStatusColor(item.status)}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.7em;">${item.status}</span>`;
    const marker = L.marker([item.lat, item.lng], {
      icon: L.divIcon({
        className: 'medical-resource-icon',
        html: `<span style="font-size:1.5em;">${iconHtml}</span>`,
        iconAnchor: [12, 32]
      })
    }).bindPopup(`<b>Equipment: ${item.name}</b><br>Type: ${item.type}<br>Status: ${statusBadge}`);
    medicalMapMarkers.addLayer(marker);
  });

  // Fit map to markers if any, otherwise center on Australia
  if (medicalIncidentData.length > 0 || medicalResources.responders.length > 0 || medicalResources.hospitals.length > 0 || medicalResources.equipment.length > 0) {
    medicalMap.fitBounds(medicalMapMarkers.getBounds().isValid() ? medicalMapMarkers.getBounds() : medicalMap.getBounds());
  } else {
    medicalMap.setView([-25.2744, 133.7751], 4);
  }

  renderMedicalTimeline(); // Update medical timeline after loading data
  updateRiskScore(); // Update risk score after loading data
}

function getMedicalStatusColor(status) {
  switch (status.toLowerCase()) {
    case 'available': return '#2ecc71'; // Green
    case 'in use': return '#3498db'; // Blue
    case 'out of service': return '#e74c3c'; // Red
    case 'limited capacity': return '#f1c40f'; // Yellow
    default: return '#6c757d'; // Grey
  }
}

function handleMedicalAction(action) {
  switch (action) {
    case 'dispatch':
      showToast('Dispatch Coordination initiated. Opening dispatch form...');
      console.log('Dispatch Coordination - Opening form');
      // Simulate opening a form: could be a modal or redirect
      alert('Simulating Dispatch Form: Assign Responder, Vehicle, ETA.');
      break;
    case 'live-status':
      showToast('Displaying Live Status of responders and resources.');
      console.log('Live Status');
      break;
    case 'request-medical':
      showToast('Requesting Medical Support. Optimizing resource suggestions...');
      console.log('Request Medical Support - Optimized suggestions');
      alert('Simulating optimized resource suggestion: Nearest available unit (e.g., Ambulance 1, 5km away).');
      break;
    case 'incident-analytics':
      showToast('Loading Incident Analytics dashboard.');
      console.log('Incident Analytics');
      break;
    case 'predictive-alerts':
      showToast('Accessing Predictive Alerts. Visualizing predicted medical demand spikes...');
      console.log('Predictive Alerts - Visualizing demand spikes');
      alert('Simulating AI-driven predictive alert: High medical demand expected in Perth Hills in next 2 hours.');
      break;
    case 'health-risk-mapping':
      showToast('Displaying Health Risk Mapping.');
      console.log('Health Risk Mapping');
      break;
    case 'responder-profiles':
      showToast('Viewing Responder Profiles.');
      console.log('Responder Profiles');
      break;
    case 'health-services':
      showToast('Accessing Health Services directory.');
      console.log('Health Services');
      break;
    case 'equipment':
      showToast('Managing Equipment inventory.');
      console.log('Equipment');
      break;
    case 'chat-dispatch':
      showToast('Opening Live Chat with Dispatch.');
      console.log('Live Chat with Dispatch');
      alert('Simulating Live Chat with Dispatch: "What is the current status of Incident #123?"');
      break;
    case 'call-coordinator':
      showToast('Calling Coordinator.');
      console.log('Calling Coordinator');
      alert('Simulating Call to Coordinator: "Connecting to Coordinator John Doe..."');
      break;
    case 'escalate':
      showToast('Quick Escalation triggered! Requesting Air Evacuation.');
      console.log('Quick Escalation - Air Evacuation');
      alert('Simulating Air Evacuation Request: "Air Ambulance requested for critical patient at Incident #001."');
      break;
    case 'open-dispatch-form':
      showToast('Opening Dispatch Form: Assign responder, vehicle, and estimated arrival time.');
      alert('Simulating Dispatch Form: Fields for Responder, Vehicle, ETA.');
      break;
    case 'view-comm-log':
      showToast('Viewing Communication Log.');
      alert('Simulating Communication Log: Time-stamped entries of chat and radio communications.');
      break;
    case 'triage-critical':
      showToast('Triage level set to Critical.');
      console.log('Triage: Critical');
      break;
    case 'triage-moderate':
      showToast('Triage level set to Moderate.');
      console.log('Triage: Moderate');
      break;
    case 'triage-minor':
      showToast('Triage level set to Minor.');
      console.log('Triage: Minor');
      break;
    case 'generate-report':
      showToast('Generating Incident Report PDF/Log.');
      alert('Simulating Report Generation: Downloadable PDF/Log suitable for briefings or debriefs.');
      break;
    case 'toggle-offline':
      const offlineSyncStatus = document.getElementById('offlineSyncStatus');
      const isOffline = this.textContent.includes('Disable');
      if (isOffline) {
        this.textContent = 'Enable Offline Mode';
        showToast('Offline Mode Disabled. Data will sync automatically.');
        offlineSyncStatus.textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
        console.log('Offline mode disabled.');
      } else {
        this.textContent = 'Disable Offline Mode';
        showToast('Offline Mode Enabled. Data will be cached and synced later.');
        offlineSyncStatus.textContent = `Last sync: ${new Date().toLocaleTimeString()} (Offline)`;
        console.log('Offline mode enabled.');
      }
      break;
    default:
      console.log(`Action: ${action}`);
  }
}

function updateRiskScore() {
  const riskScoreValue = document.getElementById('riskScoreValue');
  if (riskScoreValue) {
    // Simulate a dynamic risk score based on mock data or random values
    const score = Math.floor(Math.random() * 100) + 1; // 1-100
    riskScoreValue.textContent = score;
    if (score > 70) {
      riskScoreValue.style.color = '#e74c3c'; // High risk: Red
    } else if (score > 40) {
      riskScoreValue.style.color = '#f39c12'; // Moderate risk: Orange
    } else {
      riskScoreValue.style.color = '#2ecc71'; // Low risk: Green
    }
    showToast(`Medical Risk Score updated to ${score}.`);
  }
}

// Simulate periodic updates for risk score and offline sync status
setInterval(updateRiskScore, 10000); // Update every 10 seconds
setInterval(() => {
  const offlineSyncStatus = document.getElementById('offlineSyncStatus');
  if (offlineSyncStatus && !offlineSyncStatus.textContent.includes('(Offline)')) {
    offlineSyncStatus.textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
  }
}, 5000); // Update last sync time every 5 seconds (if online)

function renderMedicalTimeline() {
  const medicalTimelineView = document.getElementById('medicalTimelineView');
  if (!medicalTimelineView) return;

  medicalTimelineView.innerHTML = ''; // Clear existing events

  // Sort incidents by time
  medicalIncidentData.sort((a, b) => a.time - b.time);

  if (medicalIncidentData.length === 0) {
    medicalTimelineView.innerHTML = '<p style="text-align:center; width:100%;">No medical incidents to display.</p>';
    return;
  }

  const minTime = medicalIncidentData[0].time;
  const maxTime = medicalIncidentData[medicalIncidentData.length - 1].time;
  const timeSpan = maxTime - minTime;

  const baseWidth = 1500; // Minimum width for scrollability
  let scaleFactor = timeSpan > 0 ? baseWidth / timeSpan : 0;

  // Create a line for the timeline
  const timelineLine = document.createElement('div');
  timelineLine.style.position = 'absolute';
  timelineLine.style.left = '0';
  timelineLine.style.right = '0';
  timelineLine.style.top = '50%';
  timelineLine.style.height = '2px';
  timelineLine.style.backgroundColor = '#ccc';
  timelineLine.style.transform = 'translateY(-50%)';
  medicalTimelineView.appendChild(timelineLine);

  medicalIncidentData.forEach((incident, index) => {
    const eventElement = document.createElement('div');
    eventElement.className = 'timeline-event';
    
    let leftPosition;
    if (timeSpan > 0) {
      leftPosition = (incident.time - minTime) * scaleFactor;
    } else {
      leftPosition = (baseWidth / (medicalIncidentData.length + 1)) * (index + 1);
    }
    
    eventElement.style.left = `${leftPosition}px`;
    eventElement.style.position = 'absolute';
    eventElement.style.top = '50%';
    eventElement.style.transform = 'translateY(-50%)';
    eventElement.style.cursor = 'pointer';
    eventElement.style.textAlign = 'center';
    eventElement.style.padding = '0.5em';
    eventElement.style.borderRadius = '5px';
    eventElement.style.background = 'rgba(255,255,255,0.9)';
    eventElement.style.border = '1px solid #ccc';
    eventElement.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
    eventElement.style.zIndex = '10';
    eventElement.style.minWidth = '80px';

    let iconHtml;
    switch (incident.status) {
      case 'Pending': iconHtml = '🟡'; break;
      case 'En Route': iconHtml = '🔵'; break;
      case 'On Scene': iconHtml = '🟠'; break;
      case 'Completed': iconHtml = '🟢'; break;
      default: iconHtml = '⚪';
    }

    eventElement.innerHTML = `
      <div class="timeline-marker" style="font-size:1.2em;">${iconHtml}</div>
      <div class="timeline-label" style="font-size:0.8em; color:#555; white-space:normal; max-width:80px; overflow:hidden; text-overflow:ellipsis;">${incident.type}</div>
      <div style="font-size:0.7em; color:#888;">${new Date(incident.time).toLocaleTimeString()}</div>
    `;
    eventElement.title = `${incident.type} - ${incident.status} (${new Date(incident.time).toLocaleString()})`;

    medicalTimelineView.appendChild(eventElement);
  });
}
