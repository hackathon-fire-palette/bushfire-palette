const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const url = 'https://www.rfs.nsw.gov.au/feeds/majorIncidents.json';
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch RFS data' });
  }
};
