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

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const notifications = await readNotifications();
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
