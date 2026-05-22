import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { DeadlineProvider } from './context/DeadlineContext';
import { TimerProvider } from './context/TimerContext';
import { PrivateRoute } from './components/PrivateRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import OfflineIndicator from './components/ui/OfflineIndicator';
import { CookieBanner } from './components/ui/CookieBanner';
import { Protect } from './components/auth/Protect';
import { AccessDenied } from './components/auth/AccessDenied';

// Auto-retry dynamic imports on chunk load failure (stale cache after deploy)
function lazyWithRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch(() => {
      // If chunk fails to load, reload the page once to get fresh assets
      const hasReloaded = sessionStorage.getItem('chunk-reload');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk-reload', '1');
        window.location.reload();
        return new Promise(() => {}); // Never resolves, page will reload
      }
      sessionStorage.removeItem('chunk-reload');
      return factory(); // Try once more, will throw if still fails
    })
  );
}

// Lazy load all pages for better performance (code splitting)
const LoginPage = lazyWithRetry(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazyWithRetry(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazyWithRetry(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazyWithRetry(() => import('./pages/auth/ResetPasswordPage'));
import DashboardLayout from './components/layout/DashboardLayout';
const DashboardHome = lazyWithRetry(() => import('./pages/dashboard/DashboardHome'));
const ProcessListPage = lazyWithRetry(() => import('./pages/processes/ProcessListPage'));
const ProcessFormPage = lazyWithRetry(() => import('./pages/processes/ProcessFormPage'));
const ProcessDetailPage = lazyWithRetry(() => import('./pages/processes/ProcessDetailPage'));
const KanbanPage = lazyWithRetry(() => import('./pages/processes/KanbanPage'));
const ClientListPage = lazyWithRetry(() => import('./pages/clients/ClientListPage'));
const ClientFormPage = lazyWithRetry(() => import('./pages/clients/ClientFormPage'));
const ClientDetailPage = lazyWithRetry(() => import('./pages/clients/ClientDetailPage'));
const SettingsPage = lazyWithRetry(() => import('./pages/settings/SettingsPage'));
const DocumentsPage = lazyWithRetry(() => import('./pages/documents/DocumentsPage'));
const AgendaPage = lazyWithRetry(() => import('./pages/agenda/AgendaPage'));
const FinancialListPage = lazyWithRetry(() => import('./pages/financial/FinancialListPage'));
const FinancialFormPage = lazyWithRetry(() => import('./pages/financial/FinancialFormPage'));
const ContractsPage = lazyWithRetry(() => import('./pages/contracts/ContractsPage'));
const SignaturePage = lazyWithRetry(() => import('./pages/contracts/SignaturePage'));
const IAAnalisePage = lazyWithRetry(() => import('./pages/ai/IAAnalisePage'));
const LandingPage = lazyWithRetry(() => import('./pages/landing/LandingPage'));
const TemplatesPage = lazyWithRetry(() => import('./pages/templates/TemplatesPage'));
const DocumentEditorPage = lazyWithRetry(() => import('./pages/templates/DocumentEditorPage'));
const UsersPage = lazyWithRetry(() => import('./pages/users/UsersPage'));
const TimesheetPage = lazyWithRetry(() => import('./pages/timesheet/TimesheetPage'));
const ProfilePage = lazyWithRetry(() => import('./pages/profile/ProfilePage'));
const CadeiaValorPage = lazyWithRetry(() => import('./pages/gestao/CadeiaValorPage'));
const BriefingPage = lazyWithRetry(() => import('./pages/gestao/BriefingPage'));
const BillingPage = lazyWithRetry(() => import('./pages/settings/BillingPage'));
const TermsPage = lazyWithRetry(() => import('./pages/legal/TermsPage'));
const PrivacyPage = lazyWithRetry(() => import('./pages/legal/PrivacyPage'));
const LGPDPage = lazyWithRetry(() => import('./pages/legal/LGPDPage'));
const AboutPage = lazyWithRetry(() => import('./pages/landing/AboutPage'));
import GlobalAgendaNotifications from './components/notifications/GlobalAgendaNotifications';

import { PortalAuthProvider } from './context/PortalAuthContext';
import { PortalPrivateRoute } from './components/PortalPrivateRoute';
const PortalLogin = lazyWithRetry(() => import('./pages/portal/PortalLogin'));
const PortalLayout = lazyWithRetry(() => import('./components/layout/PortalLayout'));
const PortalDashboard = lazyWithRetry(() => import('./pages/portal/PortalDashboard'));
const PortalProcessList = lazyWithRetry(() => import('./pages/portal/PortalProcessList'));
const PortalProcessDetail = lazyWithRetry(() => import('./pages/portal/PortalProcessDetail'));

// Loading fallback component
const PageLoader = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-app-bg animate-in fade-in duration-200 z-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent flex items-center justify-center rounded-full animate-spin">
        <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
      </div>
      <p className="text-primary font-medium text-sm animate-pulse tracking-wide">Carregando...</p>
    </div>
  </div>
);

// Component to handle root path redirection
const HomeHandler = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/app" /> : <LandingPage />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PortalAuthProvider>
        <BrowserRouter>
          <TimerProvider>
              <ToastProvider>
                <NotificationProvider>
                  <DeadlineProvider>
                    <Suspense fallback={<PageLoader />}>
                      <OfflineIndicator />
                      <GlobalAgendaNotifications />
                      <ErrorBoundary>
                        <Routes>
                          <Route path="/login" element={<LoginPage />} />
                          <Route path="/register" element={<RegisterPage />} />
                          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                          <Route path="/" element={<HomeHandler />} />
                          <Route path="/landing" element={<LandingPage />} />
                          <Route path="/terms" element={<TermsPage />} />
                          <Route path="/privacy" element={<PrivacyPage />} />
                          <Route path="/lgpd" element={<LGPDPage />} />
                          <Route path="/about" element={<AboutPage />} />

                          <Route path="/app" element={
                            <PrivateRoute>
                              <DashboardLayout />
                            </PrivateRoute>
                          }>
                            <Route index element={<DashboardHome />} />
                            <Route path="processos" element={<ProcessListPage />} />
                            <Route path="processos/kanban" element={<KanbanPage />} />
                            <Route path="processos/novo" element={<Protect roles={['ADMIN', 'LAWYER']} fallback={<AccessDenied />}><ProcessFormPage /></Protect>} />
                            <Route path="processos/:id" element={<ProcessDetailPage />} />
                            <Route path="processos/:id/editar" element={<Protect roles={['ADMIN', 'LAWYER']} fallback={<AccessDenied />}><ProcessFormPage /></Protect>} />
                            
                            <Route path="clientes" element={<Protect roles={['ADMIN', 'LAWYER', 'INTERN']} fallback={<AccessDenied />}><ClientListPage /></Protect>} />
                            <Route path="clientes/novo" element={<Protect roles={['ADMIN', 'LAWYER']} fallback={<AccessDenied />}><ClientFormPage /></Protect>} />
                            <Route path="clientes/:id" element={<Protect roles={['ADMIN', 'LAWYER', 'INTERN']} fallback={<AccessDenied />}><ClientDetailPage /></Protect>} />
                            <Route path="clientes/:id/editar" element={<Protect roles={['ADMIN', 'LAWYER']} fallback={<AccessDenied />}><ClientFormPage /></Protect>} />
                            
                            <Route path="financeiro" element={<Protect roles={['ADMIN', 'LAWYER']} fallback={<AccessDenied />}><FinancialListPage /></Protect>} />
                            <Route path="financeiro/novo" element={<Protect roles={['ADMIN', 'LAWYER']} fallback={<AccessDenied />}><FinancialFormPage /></Protect>} />
                            <Route path="financeiro/:id/editar" element={<Protect roles={['ADMIN', 'LAWYER']} fallback={<AccessDenied />}><FinancialFormPage /></Protect>} />
                            
                            <Route path="contratos" element={<Protect roles={['ADMIN', 'LAWYER', 'INTERN']} fallback={<AccessDenied />}><ContractsPage /></Protect>} />
                            <Route path="contratos/assinatura" element={<Protect roles={['ADMIN', 'LAWYER', 'INTERN']} fallback={<AccessDenied />}><SignaturePage /></Protect>} />
                            
                            <Route path="analise-ia" element={<Protect roles={['ADMIN', 'LAWYER']} fallback={<AccessDenied />}><IAAnalisePage /></Protect>} />
                            <Route path="documentos" element={<Protect roles={['ADMIN', 'LAWYER', 'INTERN']} fallback={<AccessDenied />}><DocumentsPage /></Protect>} />
                            <Route path="agenda" element={<AgendaPage />} />
                            
                            <Route path="modelos" element={<Protect roles={['ADMIN', 'LAWYER', 'INTERN']} fallback={<AccessDenied />}><TemplatesPage /></Protect>} />
                            <Route path="modelos/:id" element={<Protect roles={['ADMIN', 'LAWYER', 'INTERN']} fallback={<AccessDenied />}><DocumentEditorPage /></Protect>} />
                            
                            <Route path="usuarios" element={<Protect roles={['ADMIN']} fallback={<AccessDenied />}><UsersPage /></Protect>} />
                            <Route path="timesheet" element={<TimesheetPage />} />
                            <Route path="perfil" element={<ProfilePage />} />
                            <Route path="configuracoes" element={<SettingsPage />} />
                            
                            {/* Gestão do Escritório */}
                            <Route path="gestao/cadeia-valor" element={<CadeiaValorPage />} />
                            <Route path="gestao/briefing" element={<BriefingPage />} />
                            <Route path="gestao/briefing/:id" element={<BriefingPage />} />
                          </Route>

                          <Route path="/portal/login" element={<PortalLogin />} />
                          <Route path="/portal" element={
                            <PortalPrivateRoute>
                              <PortalLayout />
                            </PortalPrivateRoute>
                          }>
                            <Route index element={<PortalDashboard />} />
                            <Route path="processos" element={<PortalProcessList />} />
                            <Route path="processos/:id" element={<PortalProcessDetail />} />
                          </Route>

                          <Route path="*" element={<Navigate to="/app" replace />} />
                        </Routes>
                      </ErrorBoundary>
                    </Suspense>
                  </DeadlineProvider>
                </NotificationProvider>
              </ToastProvider>
          </TimerProvider>
          <CookieBanner />
        </BrowserRouter>
        </PortalAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;


