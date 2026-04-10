export default function handler(req: any, res: any) {
  res.status(200).json({
    message: 'Pong from ROOT API',
    timestamp: new Date().toISOString()
  });
}
