// In a real application, this would be a database or a more persistent store.
// For demonstration purposes, we'll use a simple in-memory array.
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const NOTIFICATIONS_KEY = 'notifications';

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

            // Add the new notification to the beginning of the Redis list
            await redis.lpush(NOTIFICATIONS_KEY, JSON.stringify(newNotification));

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
