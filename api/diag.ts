export default function handler(req: any, res: any) {
  // Ultra-minimal diagnostic tool to verify Vercel environment
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: "Runtime Healthy",
    message: "If you see this, Vercel is executing Node.js functions correctly.",
    timestamp: new Date().toISOString(),
    node: process.version,
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      isSupabase: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('pooler'),
      nodeEnv: process.env.NODE_ENV,
      vercelRegion: process.env.VERCEL_REGION
    }
  });
}
