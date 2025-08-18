document.addEventListener('DOMContentLoaded', () => {
  const incidentReportForm = document.getElementById('incidentReportForm');
  const clearFormButton = document.getElementById('clearForm');
  const offlineModeToggle = document.getElementById('offlineModeToggle');
  const syncStatusElement = document.getElementById('syncStatus');

  let isOfflineMode = false;
  let pendingReports = [];

  // Load pending reports from localStorage on startup
  if (localStorage.getItem('pendingReports')) {
    pendingReports = JSON.parse(localStorage.getItem('pendingReports'));
    updateSyncStatus();
  }

  // Set current date and time for the datetime-local input
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Adjust for timezone
  document.getElementById('incidentDateTime').value = now.toISOString().slice(0, 16);

  incidentReportForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const report = {
      incidentType: document.getElementById('incidentType').value,
      incidentLocation: document.getElementById('incidentLocation').value,
      incidentDateTime: document.getElementById('incidentDateTime').value,
      incidentDescription: document.getElementById('incidentDescription').value,
      reportedBy: document.getElementById('reportedBy').value,
      vehicleId: document.getElementById('vehicleId').value,
      timestamp: new Date().toISOString()
    };

    if (isOfflineMode) {
      pendingReports.push(report);
      localStorage.setItem('pendingReports', JSON.stringify(pendingReports));
      alert('Report saved offline. It will sync when you are back online.');
      updateSyncStatus();
      clearForm();
    } else {
      try {
        // Simulate API call to submit report
        const response = await simulateApiSubmission(report);
        if (response.success) {
          alert('Incident report submitted successfully!');
          clearForm();
        } else {
          throw new Error(response.message || 'Submission failed.');
        }
      } catch (error) {
        console.error('Error submitting report:', error);
        alert(`Failed to submit report: ${error.message}. Saving offline.`);
        pendingReports.push(report);
        localStorage.setItem('pendingReports', JSON.stringify(pendingReports));
        updateSyncStatus();
        clearForm();
      }
    }
  });

  clearFormButton.addEventListener('click', clearForm);

  offlineModeToggle.addEventListener('change', () => {
    isOfflineMode = offlineModeToggle.checked;
    updateSyncStatus();
    if (!isOfflineMode && pendingReports.length > 0) {
      syncPendingReports();
    }
  });

  // Simulate vehicle check-in and prompt for status update
  // This would typically come from an external system or a dedicated vehicle tracking page
  function simulateVehicleCheckIn(vehicleId) {
    if (confirm(`Vehicle ${vehicleId} has checked in. Would you like to provide a quick status update?`)) {
      // Pre-fill vehicle ID and focus on description
      document.getElementById('vehicleId').value = vehicleId;
      document.getElementById('incidentDescription').focus();
      alert('Please fill out the incident report form with the status update.');
    }
  }

  // Example usage: Call this function when a vehicle checks in
  // setTimeout(() => simulateVehicleCheckIn('Truck-005'), 5000); // Simulate a check-in after 5 seconds

  function clearForm() {
    incidentReportForm.reset();
    document.getElementById('incidentDateTime').value = now.toISOString().slice(0, 16); // Reset date/time
    document.getElementById('offlineModeToggle').checked = isOfflineMode; // Keep offline mode state
  }

  function updateSyncStatus() {
    if (isOfflineMode) {
      syncStatusElement.textContent = `Sync Status: Offline (${pendingReports.length} pending reports)`;
      syncStatusElement.classList.add('offline-indicator');
      syncStatusElement.classList.remove('online-indicator');
    } else if (navigator.onLine) {
      syncStatusElement.textContent = `Sync Status: Online (${pendingReports.length} pending reports)`;
      syncStatusElement.classList.add('online-indicator');
      syncStatusElement.classList.remove('offline-indicator');
    } else {
      syncStatusElement.textContent = `Sync Status: Offline (Browser offline, ${pendingReports.length} pending reports)`;
      syncStatusElement.classList.add('offline-indicator');
      syncStatusElement.classList.remove('online-indicator');
    }
  }

  async function syncPendingReports() {
    if (pendingReports.length === 0 || isOfflineMode || !navigator.onLine) {
      updateSyncStatus();
      return;
    }

    console.log('Attempting to sync pending reports...');
    const reportsToSync = [...pendingReports]; // Work on a copy
    let successfullySyncedCount = 0;

    for (const report of reportsToSync) {
      try {
        const response = await simulateApiSubmission(report);
        if (response.success) {
          successfullySyncedCount++;
          // Remove successfully synced report from pendingReports
          pendingReports = pendingReports.filter(r => r.timestamp !== report.timestamp);
        } else {
          console.warn('Failed to sync one report:', report, response.message);
        }
      } catch (error) {
        console.error('Error during sync of report:', report, error);
      }
    }

    localStorage.setItem('pendingReports', JSON.stringify(pendingReports));
    updateSyncStatus();

    if (successfullySyncedCount > 0) {
      alert(`${successfullySyncedCount} report(s) synced successfully!`);
    }
  }

  // Simulate network status changes
  window.addEventListener('online', () => {
    alert('You are back online! Attempting to sync pending reports.');
    updateSyncStatus();
    syncPendingReports();
  });

  window.addEventListener('offline', () => {
    alert('You are offline. Reports will be saved locally.');
    updateSyncStatus();
  });

  // Initial sync status update
  updateSyncStatus();

  // Dummy API submission function
  function simulateApiSubmission(report) {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('Simulating API submission:', report);
        // Simulate success or failure randomly
        const success = Math.random() > 0.1; // 90% success rate
        if (success) {
          resolve({ success: true, message: 'Report submitted.' });
        } else {
          resolve({ success: false, message: 'Network error or server unavailable.' });
        }
      }, 1000); // Simulate network delay
    });
  }
});
