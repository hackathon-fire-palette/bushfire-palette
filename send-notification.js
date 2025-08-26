document.addEventListener('DOMContentLoaded', () => {
    const notificationForm = document.getElementById('notificationForm');
    const responseMessage = document.getElementById('responseMessage');

    notificationForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const title = document.getElementById('title').value;
        const message = document.getElementById('message').value;

        responseMessage.textContent = 'Sending notification...';
        responseMessage.className = '';

        try {
            const response = await fetch('/api/send-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, message }),
            });

            const data = await response.json();

            if (response.ok) {
                responseMessage.textContent = data.message;
                responseMessage.className = 'success';
                notificationForm.reset();
            } else {
                responseMessage.textContent = data.error || 'Failed to send notification.';
                responseMessage.className = 'error';
            }
        } catch (error) {
            console.error('Error sending notification:', error);
            responseMessage.textContent = 'An error occurred while sending notification.';
            responseMessage.className = 'error';
        }
    });
});
