document.addEventListener('DOMContentLoaded', () => {
  const monthYearElement = document.getElementById('month-year');
  const calendarElement = document.getElementById('roster-calendar');
  const availabilityListElement = document.getElementById('availability-list');
  const prevMonthButton = document.getElementById('prev-month');
  const nextMonthButton = document.getElementById('next-month');
  const fairnessFillElement = document.getElementById('fairness-fill');
  const fairnessScoreElement = document.getElementById('fairness-score');

  let currentDate = new Date();

  // Dummy data for skills and fatigue for demonstration
  const employeeSkills = {
    "John Doe": ["Firefighting", "First Aid"],
    "Jane Smith": ["Logistics", "Communications"],
    "Peter Jones": ["Firefighting", "Heavy Vehicle Operation"],
    "Mary Williams": ["First Aid", "Communications"]
  };

  const employeeFatigue = {
    "John Doe": 0, // 0-100, 100 being highly fatigued
    "Jane Smith": 10,
    "Peter Jones": 50,
    "Mary Williams": 20
  };

  const renderCalendar = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    monthYearElement.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDay = firstDayOfMonth.getDay();

    calendarElement.innerHTML = '';

    const headerRow = document.createElement('div');
    headerRow.classList.add('calendar-header');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
      const dayElement = document.createElement('div');
      dayElement.textContent = day;
      headerRow.appendChild(dayElement);
    });
    calendarElement.appendChild(headerRow);

    const calendarGrid = document.createElement('div');
    calendarGrid.classList.add('calendar-grid');
    calendarElement.appendChild(calendarGrid);

    for (let i = 0; i < startingDay; i++) {
      const emptyCell = document.createElement('div');
      calendarGrid.appendChild(emptyCell);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayCell = document.createElement('div');
      dayCell.classList.add('calendar-day');
      dayCell.textContent = i;

      const date = new Date(year, month, i);
      const dateString = date.toISOString().split('T')[0];

      if (rosterData[dateString]) {
        const rosterList = document.createElement('ul');
        rosterData[dateString].forEach(employee => {
          const listItem = document.createElement('li');
          listItem.textContent = employee;
          // Add fatigue alert (simple example: if fatigue > 40)
          if (employeeFatigue[employee] > 40) {
            listItem.classList.add('fatigue-alert');
            listItem.title = `Fatigue Level: ${employeeFatigue[employee]} (High)`;
          }
          rosterList.appendChild(listItem);
        });
        dayCell.appendChild(rosterList);
      }
      calendarGrid.appendChild(dayCell);
    }
  };

  const renderAvailability = () => {
    availabilityListElement.innerHTML = '';
    employeeAvailability.forEach(employee => {
      const listItem = document.createElement('li');
      listItem.textContent = `${employee.name}: ${employee.available ? 'Available' : 'Unavailable'}`;
      availabilityListElement.appendChild(listItem);
    });
  };

  const calculateFairness = () => {
    const employeeShiftCounts = {};
    const employeeWeekendCounts = {};
    const employeeHolidayCounts = {};
    const allEmployees = employeeAvailability.map(emp => emp.name);

    allEmployees.forEach(emp => {
      employeeShiftCounts[emp] = 0;
      employeeWeekendCounts[emp] = 0;
      employeeHolidayCounts[emp] = 0;
    });

    // Iterate through rosterData to count shifts
    for (const dateString in rosterData) {
      const date = new Date(dateString);
      const dayOfWeek = date.getDay(); // 0 for Sunday, 6 for Saturday
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      // For simplicity, no actual holiday data, just a placeholder
      const isHoliday = false; // Placeholder for actual holiday check

      rosterData[dateString].forEach(employee => {
        employeeShiftCounts[employee]++;
        if (isWeekend) {
          employeeWeekendCounts[employee]++;
        }
        if (isHoliday) {
          employeeHolidayCounts[employee]++;
        }
      });
    }

    // Calculate fairness score (simple example: variance in shift counts)
    const shiftCounts = Object.values(employeeShiftCounts);
    if (shiftCounts.length === 0) {
      fairnessScoreElement.textContent = "Score: N/A (No shifts)";
      fairnessFillElement.style.width = '0%';
      return;
    }

    const sum = shiftCounts.reduce((a, b) => a + b, 0);
    const mean = sum / shiftCounts.length;
    const variance = shiftCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / shiftCounts.length;
    const stdDev = Math.sqrt(variance);

    // Normalize stdDev to a 0-100 score (lower stdDev is better, so higher score)
    // This is a very basic normalization. Max possible stdDev depends on data range.
    // Assuming max reasonable stdDev for demonstration purposes.
    const maxStdDev = 5; // Adjust based on expected shift distribution
    let fairnessPercentage = Math.max(0, 100 - (stdDev / maxStdDev) * 100);
    fairnessPercentage = Math.min(100, fairnessPercentage); // Cap at 100%

    fairnessFillElement.style.width = `${fairnessPercentage}%`;
    fairnessScoreElement.textContent = `Score: ${fairnessPercentage.toFixed(1)}% (Lower variance is fairer)`;

    // You could also display individual employee stats for more detail
    // console.log("Shift Counts:", employeeShiftCounts);
    // console.log("Weekend Counts:", employeeWeekendCounts);
  };


  prevMonthButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    calculateFairness(); // Recalculate fairness for the new month if data changes per month
  });

  nextMonthButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    calculateFairness(); // Recalculate fairness for the new month if data changes per month
  });

  if (typeof rosterData !== 'undefined' && typeof employeeAvailability !== 'undefined') {
    renderCalendar();
    renderAvailability();
    calculateFairness();
  } else {
    console.error('Roster data not found.');
  }
});
