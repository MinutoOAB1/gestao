module.exports = (req, res) => {
  // Bare-minimum infrastructure check in plain JavaScript
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ 
    status: "Infrastructure UP (Plain JS)",
    timestamp: new Date().toISOString(),
    node: process.version,
    env: {
       vercelRegion: process.env.VERCEL_REGION,
       hasDb: !!process.env.DATABASE_URL
    }
  });
};
