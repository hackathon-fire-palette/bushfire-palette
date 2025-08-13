document.addEventListener('DOMContentLoaded', () => {
    const submitLeaveBtn = document.getElementById('submit-leave-btn');
    const leaveModal = document.getElementById('leave-modal');
    const closeButton = document.querySelector('.close-button');
    const leaveForm = document.getElementById('leave-form');
    const leaveList = document.getElementById('leave-list');

    const sampleLeaves = [
        { id: 1, startDate: '2025-08-20', endDate: '2025-08-22', type: 'Annual Leave', status: 'Approved' },
        { id: 2, startDate: '2025-09-01', endDate: '2025-09-01', type: 'Sick Leave', status: 'Submitted' }
    ];

    function renderLeaveList() {
        leaveList.innerHTML = '';
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
        const tbody = table.querySelector('tbody');
        sampleLeaves.forEach(leave => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${leave.startDate}</td>
                <td>${leave.endDate}</td>
                <td>${leave.type}</td>
                <td>${leave.status}</td>
                <td><button class="withdraw-btn" data-id="${leave.id}" ${leave.status !== 'Submitted' ? 'disabled' : ''}>Withdraw</button></td>
            `;
            tbody.appendChild(row);
        });
        leaveList.appendChild(table);
    }

    submitLeaveBtn.addEventListener('click', () => {
        leaveModal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        leaveModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === leaveModal) {
            leaveModal.style.display = 'none';
        }
    });

    leaveForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const leaveType = document.getElementById('leave-type').value;
        
        const newLeave = {
            id: sampleLeaves.length + 1,
            startDate,
            endDate,
            type: leaveType.charAt(0).toUpperCase() + leaveType.slice(1) + ' Leave',
            status: 'Submitted'
        };

        sampleLeaves.push(newLeave);
        renderLeaveList();
        leaveModal.style.display = 'none';
        leaveForm.reset();
    });

    leaveList.addEventListener('click', (event) => {
        if (event.target.classList.contains('withdraw-btn')) {
            const leaveId = parseInt(event.target.getAttribute('data-id'));
            const leave = sampleLeaves.find(l => l.id === leaveId);
            if (leave) {
                leave.status = 'Withdrawn';
                renderLeaveList();
            }
        }
    });

    renderLeaveList();
});
