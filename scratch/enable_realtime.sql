-- Script para habilitar o Supabase Realtime nas tabelas do sistema
BEGIN;

-- Garante que a publicação existe (o Supabase normalmente já a cria)
-- CREATE PUBLICATION supabase_realtime;

-- Adiciona as tabelas à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE "Tenant";
ALTER PUBLICATION supabase_realtime ADD TABLE "User";
ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";
ALTER PUBLICATION supabase_realtime ADD TABLE "Process";
ALTER PUBLICATION supabase_realtime ADD TABLE "Client";
ALTER PUBLICATION supabase_realtime ADD TABLE "FinancialRecord";
ALTER PUBLICATION supabase_realtime ADD TABLE "Invoice";
ALTER PUBLICATION supabase_realtime ADD TABLE "Contract";
ALTER PUBLICATION supabase_realtime ADD TABLE "Document";
ALTER PUBLICATION supabase_realtime ADD TABLE "Template";
ALTER PUBLICATION supabase_realtime ADD TABLE "TimeEntry";
ALTER PUBLICATION supabase_realtime ADD TABLE "AiAnalysisLog";
ALTER PUBLICATION supabase_realtime ADD TABLE "LoginHistory";
ALTER PUBLICATION supabase_realtime ADD TABLE "AuditLog";
ALTER PUBLICATION supabase_realtime ADD TABLE "TenantSettings";

COMMIT;
