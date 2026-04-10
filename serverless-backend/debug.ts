export default function handler(req: any, res: any) {
  res.status(200).json({ 
    status: 'API functions are active', 
    time: new Date().toISOString(),
    env: process.env.VERCEL ? 'production' : 'development'
  });
}
