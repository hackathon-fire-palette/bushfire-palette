// In a real application, this would be a database or a more persistent store.
// For demonstration purposes, we'll use a simple in-memory array.
import fs from 'fs/promises';
import path from 'path';

const NOTIFICATIONS_FILE = path.resolve(process.cwd(), 'data', 'notifications.json');

async function readNotifications() {
    try {
        const data = await fs.readFile(NOTIFICATIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File does not exist, return empty array
            return [];
        }
        throw error;
    }
}

async function writeNotifications(notifications) {
    await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2), 'utf8');
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { title, message } = req.body;

            if (!title || !message) {
                return res.status(400).json({ error: 'Title and message are required.' });
            }

            const newNotification = {
                id: Date.now(), // Simple unique ID
                title,
                message,
                timestamp: new Date().toISOString(),
            };

            const notifications = await readNotifications();
            notifications.push(newNotification);
            await writeNotifications(notifications);

            console.log('Notification sent:', newNotification);

            return res.status(200).json({ message: 'Notification sent successfully!', notification: newNotification });
        } catch (error) {
            console.error('Error sending notification:', error);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
