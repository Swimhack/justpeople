import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ActivityTracker } from "./components/ActivityTracker";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ContactsPage from "./pages/ContactsPage";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ProtectedAdminRoute } from "./components/admin/ProtectedAdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersPage from "./pages/admin/UsersPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import ContentPage from "./pages/admin/ContentPage";
import AIAssistantPage from "./pages/admin/AIAssistantPage";
import JarvisControlPage from "./pages/admin/JarvisControlPage";
import JarvisControlCenter from "./pages/admin/JarvisControlCenter";
import InvitationsPage from "./pages/admin/InvitationsPage";
import NewsPage from "./pages/admin/NewsPage";
import MessagesPage from "./pages/admin/MessagesPage";
import SettingsPage from "./pages/admin/SettingsPage";
import VideoCallPage from "./pages/VideoCallPage";
import InvitePage from "./pages/InvitePage";
import LogsPage from "./pages/admin/LogsPage";
import ActivityLogsPage from "./pages/admin/ActivityLogsPage";
import WOOCPage from "./pages/admin/WOOCPage";
import WOOCDiscussionsPage from "./pages/admin/WOOCDiscussionsPage";
import WOOCDocumentsPage from "./pages/admin/WOOCDocumentsPage";
import WOOCPRDPage from "./pages/admin/WOOCPRDPage";
import WOOCBestPracticesPage from "./pages/admin/WOOCBestPracticesPage";
import CRMDashboard from "./pages/admin/CRMDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ActivityTracker />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={
            <ProtectedAdminRoute>
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/analytics" element={
            <ProtectedAdminRoute>
              <DashboardLayout>
                <AnalyticsPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/users" element={
            <ProtectedAdminRoute requireAdmin={true}>
              <DashboardLayout>
                <UsersPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/content" element={
            <ProtectedAdminRoute>
              <DashboardLayout>
                <ContentPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/ai" element={
            <ProtectedAdminRoute>
              <DashboardLayout>
                <AIAssistantPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/jarvis" element={
            <ProtectedAdminRoute>
              <DashboardLayout>
                <JarvisControlCenter />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/jarvis-legacy" element={
            <ProtectedAdminRoute>
              <DashboardLayout>
                <JarvisControlPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/contacts" element={
            <ProtectedAdminRoute>
              <DashboardLayout>
                <ContactsPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/invitations" element={
            <ProtectedAdminRoute requireAdmin={true}>
              <DashboardLayout>
                <InvitationsPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/news" element={
            <ProtectedAdminRoute>
              <DashboardLayout>
                <NewsPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/video" element={
            <ProtectedAdminRoute>
              <DashboardLayout>
                <VideoCallPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/messages" element={
            <ProtectedAdminRoute>
              <DashboardLayout>
                <MessagesPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/settings" element={
            <ProtectedAdminRoute requireAdmin={true}>
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/logs" element={
            <ProtectedAdminRoute>
              <DashboardLayout>
                <LogsPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/activity-logs" element={
            <ProtectedAdminRoute requireAdmin={true}>
              <DashboardLayout>
                <ActivityLogsPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/wooc" element={
            <ProtectedAdminRoute>
              <DashboardLayout>
                <WOOCPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/wooc/discussions" element={
            <ProtectedAdminRoute>
              <DashboardLayout>
                <WOOCDiscussionsPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/wooc/documents" element={
            <ProtectedAdminRoute>
              <DashboardLayout>
                <WOOCDocumentsPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/wooc/prd" element={
            <ProtectedAdminRoute>
              <DashboardLayout>
                <WOOCPRDPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/wooc/best-practices" element={
            <ProtectedAdminRoute>
              <DashboardLayout>
                <WOOCBestPracticesPage />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/dashboard/crm" element={
            <ProtectedAdminRoute>
              <DashboardLayout>
                <CRMDashboard />
              </DashboardLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
