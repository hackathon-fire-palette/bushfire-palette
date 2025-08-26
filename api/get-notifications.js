import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const NOTIFICATIONS_KEY = 'notifications';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            // Retrieve all notifications from the Redis list
            const rawNotifications = await redis.lrange(NOTIFICATIONS_KEY, 0, -1);
            const notifications = rawNotifications.map(JSON.parse);
            
            // Notifications are already stored in reverse chronological order due to lpush
            // No need to sort again if lpush is used consistently.
            
            return res.status(200).json({ notifications });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
