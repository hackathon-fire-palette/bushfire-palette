import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            // Retrieve existing notifications, or an empty array if none exist
            const notifications = await kv.get('notifications') || [];
            
            // Sort notifications by timestamp in descending order (most recent first)
            notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
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
