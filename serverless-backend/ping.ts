export default function handler(req, res) {
  res.status(200).json({ status: "Backend path is reachable!", timestamp: new Date().toISOString() });
}
