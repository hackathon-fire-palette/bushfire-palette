import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const NOTIFICATIONS_KEY = 'notifications';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            // Delete the Redis list containing notifications
            await redis.del(NOTIFICATIONS_KEY);

            console.log('All notifications cleared from Redis.');

            return res.status(200).json({ message: 'All notifications cleared successfully!' });
        } catch (error) {
            console.error('Error clearing notifications:', error);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
