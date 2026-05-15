module.exports = (req, res) => {
  res.status(200).json({
    status: 'Infrastructure UP (Plain JS)',
    timestamp: new Date().toISOString(),
    node_version: process.version,
    env: process.env.NODE_ENV,
    region: process.env.VERCEL_REGION || 'local',
    location: 'root/api/ping.js'
  });
};
