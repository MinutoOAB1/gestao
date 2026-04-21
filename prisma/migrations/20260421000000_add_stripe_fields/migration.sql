DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Tenant' AND column_name='stripeCustomerId') THEN
        ALTER TABLE "Tenant" ADD COLUMN "stripeCustomerId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Tenant' AND column_name='stripeSubscriptionId') THEN
        ALTER TABLE "Tenant" ADD COLUMN "stripeSubscriptionId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Tenant' AND column_name='subscriptionStatus') THEN
        ALTER TABLE "Tenant" ADD COLUMN "subscriptionStatus" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Tenant' AND column_name='plan') THEN
        ALTER TABLE "Tenant" ADD COLUMN "plan" TEXT DEFAULT 'FREE';
    END IF;
END $$;

-- CreateIndex (if not exists is harder for indexes in plain SQL without helper, but usually fine)
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_stripeCustomerId_key" ON "Tenant"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_stripeSubscriptionId_key" ON "Tenant"("stripeSubscriptionId");
