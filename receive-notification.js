document.addEventListener('DOMContentLoaded', () => {
    const notificationsList = document.getElementById('notificationsList');
    const statusMessage = document.getElementById('statusMessage');
    const clearNotificationsButton = document.getElementById('clearNotificationsButton');

    async function fetchNotifications() {
        statusMessage.textContent = 'Loading notifications...';
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
                } else {
                    statusMessage.textContent = 'No notifications received yet.';
                }
            } else {
                statusMessage.textContent = data.error || 'Failed to fetch notifications.';
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            statusMessage.textContent = 'An error occurred while fetching notifications.';
        }
    }

    async function clearNotifications() {
        if (!confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
            return;
        }

        statusMessage.textContent = 'Clearing notifications...';
        try {
            const response = await fetch('/api/clear-notifications', {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                statusMessage.textContent = data.message;
                notificationsList.innerHTML = ''; // Clear displayed notifications
                fetchNotifications(); // Re-fetch to confirm empty state
            } else {
                statusMessage.textContent = data.error || 'Failed to clear notifications.';
            }
        } catch (error) {
            console.error('Error clearing notifications:', error);
            statusMessage.textContent = 'An error occurred while clearing notifications.';
        }
    }

    // Fetch notifications initially
    fetchNotifications();

    // Poll for new notifications every 5 seconds
    setInterval(fetchNotifications, 5000);

    // Add event listener for the clear button
    clearNotificationsButton.addEventListener('click', clearNotifications);
});
