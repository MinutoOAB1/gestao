module.exports = (req, res) => {
  res.status(200).json({
    status: 'Infrastructure UP (Plain JS)',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    location: 'root/api/ping.js'
  });
};
