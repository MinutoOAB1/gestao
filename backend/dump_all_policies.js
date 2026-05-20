const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Basic .env parser
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                process.env[key.trim()] = value;
            }
        });
    }
}

loadEnv();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  try {
    const allPolicies = await prisma.$queryRaw`
      SELECT 
        schemaname, 
        tablename, 
        policyname, 
        permissive, 
        roles, 
        cmd, 
        qual, 
        with_check 
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    console.log('--- ALL RLS POLICIES ---');
    console.log(JSON.stringify(allPolicies, null, 2));

  } catch (error) {
    console.error('Error fetching policies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
