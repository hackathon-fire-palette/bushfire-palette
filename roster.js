document.addEventListener('DOMContentLoaded', () => {
  const monthYearElement = document.getElementById('month-year');
  const calendarElement = document.getElementById('roster-calendar');
  const availabilityListElement = document.getElementById('availability-list');
  const prevMonthButton = document.getElementById('prev-month');
  const nextMonthButton = document.getElementById('next-month');

  let currentDate = new Date();

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

  prevMonthButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  nextMonthButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  if (typeof rosterData !== 'undefined' && typeof employeeAvailability !== 'undefined') {
    renderCalendar();
    renderAvailability();
  } else {
    console.error('Roster data not found.');
  }
});
