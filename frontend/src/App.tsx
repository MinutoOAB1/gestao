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

// Lazy load all pages for better performance (code splitting)
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
import DashboardLayout from './components/layout/DashboardLayout';
const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome'));
const ProcessListPage = lazy(() => import('./pages/processes/ProcessListPage'));
const ProcessFormPage = lazy(() => import('./pages/processes/ProcessFormPage'));
const ProcessDetailPage = lazy(() => import('./pages/processes/ProcessDetailPage'));
const KanbanPage = lazy(() => import('./pages/processes/KanbanPage'));
const ClientListPage = lazy(() => import('./pages/clients/ClientListPage'));
const ClientFormPage = lazy(() => import('./pages/clients/ClientFormPage'));
const ClientDetailPage = lazy(() => import('./pages/clients/ClientDetailPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const DocumentsPage = lazy(() => import('./pages/documents/DocumentsPage'));
const AgendaPage = lazy(() => import('./pages/agenda/AgendaPage'));
const FinancialListPage = lazy(() => import('./pages/financial/FinancialListPage'));
const FinancialFormPage = lazy(() => import('./pages/financial/FinancialFormPage'));
const ContractsPage = lazy(() => import('./pages/contracts/ContractsPage'));
const IAAnalisePage = lazy(() => import('./pages/ai/IAAnalisePage'));
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const TemplatesPage = lazy(() => import('./pages/templates/TemplatesPage'));
const DocumentEditorPage = lazy(() => import('./pages/templates/DocumentEditorPage'));
const UsersPage = lazy(() => import('./pages/users/UsersPage'));
const TimesheetPage = lazy(() => import('./pages/timesheet/TimesheetPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const BillingPage = lazy(() => import('./pages/settings/BillingPage'));
import GlobalAgendaNotifications from './components/notifications/GlobalAgendaNotifications';

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

                          <Route path="/app" element={
                            <PrivateRoute>
                              <DashboardLayout />
                            </PrivateRoute>
                          }>
                            <Route index element={<DashboardHome />} />
                            <Route path="processos" element={<ProcessListPage />} />
                            <Route path="processos/kanban" element={<KanbanPage />} />
                            <Route path="processos/novo" element={<ProcessFormPage />} />
                            <Route path="processos/:id" element={<ProcessDetailPage />} />
                            <Route path="processos/:id/editar" element={<ProcessFormPage />} />
                            <Route path="clientes" element={<ClientListPage />} />
                            <Route path="clientes/novo" element={<ClientFormPage />} />
                            <Route path="clientes/:id" element={<ClientDetailPage />} />
                            <Route path="clientes/:id/editar" element={<ClientFormPage />} />
                            <Route path="financeiro" element={<FinancialListPage />} />
                            <Route path="financeiro/novo" element={<FinancialFormPage />} />
                            <Route path="financeiro/:id/editar" element={<FinancialFormPage />} />
                            <Route path="contratos" element={<ContractsPage />} />
                            <Route path="analise-ia" element={<IAAnalisePage />} />
                            <Route path="documentos" element={<DocumentsPage />} />
                            <Route path="agenda" element={<AgendaPage />} />
                            <Route path="modelos" element={<TemplatesPage />} />
                            <Route path="modelos/:id" element={<DocumentEditorPage />} />
                            <Route path="usuarios" element={<UsersPage />} />
                            <Route path="timesheet" element={<TimesheetPage />} />
                            <Route path="perfil" element={<ProfilePage />} />
                            <Route path="configuracoes" element={<SettingsPage />} />
                          </Route>

                          <Route path="*" element={<Navigate to="/app" replace />} />
                        </Routes>
                      </ErrorBoundary>
                    </Suspense>
                  </DeadlineProvider>
                </NotificationProvider>
              </ToastProvider>
          </TimerProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

