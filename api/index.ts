export default async function handler(req: any, res: any) {
  try {
    const app = await import('./app');
    return await app.default(req, res);
  } catch (error: any) {
    console.error('TOP LEVEL CRASH CATCHER:', error);
    return res.status(500).json({
      error: "TOP_LEVEL_VERCEL_CRASH",
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      name: error?.name,
      location: "root/api/index.ts (Dynamic Import Wrapper)"
    });
  }
}
