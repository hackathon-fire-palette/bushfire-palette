document.addEventListener('DOMContentLoaded', () => {
  const fleetDashboardGrid = document.getElementById('fleetDashboardGrid');
  const vehicleTypeFilter = document.getElementById('vehicleTypeFilter');
  const vehicleStatusFilter = document.getElementById('vehicleStatusFilter');
  const usageFilter = document.getElementById('usageFilter');
  const applyFiltersButton = document.getElementById('applyFilters');

  // Dummy data for vehicles
  let vehicles = [
    {
      id: 'V001',
      name: 'Fire Truck Alpha',
      type: 'truck',
      age: 5, // years
      kmTravelled: 120000, // km
      fuelBurn: 25, // L/100km
      riskOfFailure: 0.15, // 0-1
      status: 'active', // active, oos (out of service), standby
      usageScore: 0.8 // 0-1, 0.5 is normal, <0.5 underused, >0.5 overused
    },
    {
      id: 'V002',
      name: 'Patrol Car Bravo',
      type: 'car',
      age: 2,
      kmTravelled: 45000,
      fuelBurn: 8,
      riskOfFailure: 0.05,
      status: 'active',
      usageScore: 0.4
    },
    {
      id: 'V003',
      name: 'Water Tanker Charlie',
      type: 'truck',
      age: 10,
      kmTravelled: 250000,
      fuelBurn: 30,
      riskOfFailure: 0.70,
      status: 'oos',
      usageScore: 0.9
    },
    {
      id: 'V004',
      name: 'Rescue Boat Delta',
      type: 'boat',
      age: 3,
      kmTravelled: 15000, // nautical miles equivalent
      fuelBurn: 15,
      riskOfFailure: 0.10,
      status: 'standby',
      usageScore: 0.2
    },
    {
      id: 'V005',
      name: 'Command Vehicle Echo',
      type: 'car',
      age: 7,
      kmTravelled: 180000,
      fuelBurn: 10,
      riskOfFailure: 0.40,
      status: 'active',
      usageScore: 0.6
    }
  ];

  function getStatusClass(status) {
    switch (status) {
      case 'active': return 'active';
      case 'oos': return 'oos';
      case 'standby': return 'standby';
      default: return '';
    }
  }

  function getUsageClass(usageScore) {
    if (usageScore < 0.3) return 'underused';
    if (usageScore > 0.7) return 'overused';
    return 'normal-usage';
  }

  function getUsageLabel(usageScore) {
    if (usageScore < 0.3) return 'Underused';
    if (usageScore > 0.7) return 'Overused';
    return 'Normal Usage';
  }

  function renderVehicles(filteredVehicles) {
    fleetDashboardGrid.innerHTML = '';
    if (filteredVehicles.length === 0) {
      fleetDashboardGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">No vehicles found matching your filters.</p>';
      return;
    }

    filteredVehicles.forEach(vehicle => {
      const vehicleCard = document.createElement('div');
      vehicleCard.classList.add('vehicle-card', getUsageClass(vehicle.usageScore));
      vehicleCard.innerHTML = `
        <h3>
          <img src="assets/firetruck-${vehicle.status}.svg" alt="${vehicle.status} icon" width="24" height="24" style="vertical-align:middle;">
          ${vehicle.name} (${vehicle.id})
        </h3>
        <p><strong>Type:</strong> ${vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)}</p>
        <p><strong>Status:</strong> <span class="status-indicator ${getStatusClass(vehicle.status)}"></span> ${vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}</p>
        <p><strong>Age:</strong> ${vehicle.age} years</p>
        <p><strong>Km Travelled:</strong> ${vehicle.kmTravelled.toLocaleString()} km</p>
        <p><strong>Fuel Burn:</strong> ${vehicle.fuelBurn} L/100km</p>
        <p><strong>Risk of Failure:</strong> ${(vehicle.riskOfFailure * 100).toFixed(0)}%</p>
        <div class="usage-bar">
          <div class="usage-fill" style="width: ${(vehicle.usageScore * 100).toFixed(0)}%;"></div>
        </div>
        <div class="usage-label">Usage: ${getUsageLabel(vehicle.usageScore)} (${(vehicle.usageScore * 100).toFixed(0)}%)</div>
      `;
      fleetDashboardGrid.appendChild(vehicleCard);
    });
  }

  function applyFilters() {
    const selectedType = vehicleTypeFilter.value;
    const selectedStatus = vehicleStatusFilter.value;
    const selectedUsage = usageFilter.value;

    const filtered = vehicles.filter(vehicle => {
      const typeMatch = selectedType === 'all' || vehicle.type === selectedType;
      const statusMatch = selectedStatus === 'all' || vehicle.status === selectedStatus;
      let usageMatch = true;
      if (selectedUsage === 'underused') {
        usageMatch = vehicle.usageScore < 0.3;
      } else if (selectedUsage === 'overused') {
        usageMatch = vehicle.usageScore > 0.7;
      } else if (selectedUsage === 'normal') {
        usageMatch = vehicle.usageScore >= 0.3 && vehicle.usageScore <= 0.7;
      }
      return typeMatch && statusMatch && usageMatch;
    });
    renderVehicles(filtered);
  }

  applyFiltersButton.addEventListener('click', applyFilters);

  // Initial render
  renderVehicles(vehicles);
});
