document.addEventListener('DOMContentLoaded', () => {
    const notificationsList = document.getElementById('notificationsList');
    const statusMessage = document.getElementById('statusMessage');
    const clearNotificationsButton = document.getElementById('clearNotificationsButton');

    async function fetchNotifications() {
        statusMessage.textContent = 'Loading notifications...';
        statusMessage.classList.add('visible');
        statusMessage.classList.remove('success', 'error');

        try {
            const response = await fetch('/api/get-notifications');
            const data = await response.json();

            if (response.ok) {
                notificationsList.innerHTML = ''; // Clear existing notifications
                if (data.notifications && data.notifications.length > 0) {
                    data.notifications.forEach(notification => {
                        const listItem = document.createElement('li');
                        listItem.className = 'notification-item';
                        listItem.innerHTML = `
                            <h2>${notification.title}</h2>
                            <p>${notification.message}</p>
                            <div class="timestamp">${new Date(notification.timestamp).toLocaleString()}</div>
                        `;
                        notificationsList.prepend(listItem); // Add new notifications at the top
                    });
                    statusMessage.textContent = ''; // Clear status message on success
                    statusMessage.classList.remove('visible'); // Hide status message if successful and notifications exist
                } else {
                    statusMessage.textContent = 'No notifications received yet.';
                    statusMessage.classList.add('visible');
                }
            } else {
                statusMessage.textContent = data.error || 'Failed to fetch notifications.';
                statusMessage.classList.add('error', 'visible');
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            statusMessage.textContent = 'An error occurred while fetching notifications.';
            statusMessage.classList.add('error', 'visible');
        }
    }

    async function clearNotifications() {
        if (!confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
            return;
        }

        statusMessage.textContent = 'Clearing notifications...';
        statusMessage.classList.add('visible');
        statusMessage.classList.remove('success', 'error');

        try {
            const response = await fetch('/api/clear-notifications', {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                statusMessage.textContent = data.message;
                statusMessage.classList.add('success');
                notificationsList.innerHTML = ''; // Clear displayed notifications
                fetchNotifications(); // Re-fetch to confirm empty state
            } else {
                statusMessage.textContent = data.error || 'Failed to clear notifications.';
                statusMessage.classList.add('error');
            }
        } catch (error) {
            console.error('Error clearing notifications:', error);
            statusMessage.textContent = 'An error occurred while clearing notifications.';
            statusMessage.classList.add('error');
        }
    }

    // Fetch notifications initially
    fetchNotifications();

    // Poll for new notifications every 5 seconds
    setInterval(fetchNotifications, 5000);

    // Add event listener for the clear button
    clearNotificationsButton.addEventListener('click', clearNotifications);
});
