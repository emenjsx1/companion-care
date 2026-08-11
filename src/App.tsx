import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Styleguide from "./pages/Styleguide";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Students from "./pages/admin/Students";
import Payments from "./pages/admin/Payments";
import Financials from "./pages/admin/Financials";
import Courses from "./pages/admin/Courses";
import Exams from "./pages/admin/Exams";
import Communication from "./pages/admin/Communication";
import Settings from "./pages/admin/Settings";
import UserManagement from "./pages/admin/UserManagement";
import Gallery from "./pages/admin/Gallery";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/styleguide" element={<Styleguide />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<Login />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requireAdmin>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/students" element={
              <ProtectedRoute requireAdmin>
                <Students />
              </ProtectedRoute>
            } />
            <Route path="/admin/payments" element={
              <ProtectedRoute requireAdmin>
                <Payments />
              </ProtectedRoute>
            } />
            <Route path="/admin/financials" element={
              <ProtectedRoute requireAdmin>
                <Financials />
              </ProtectedRoute>
            } />
            <Route path="/admin/courses" element={
              <ProtectedRoute requireAdmin>
                <Courses />
              </ProtectedRoute>
            } />
            <Route path="/admin/exams" element={
              <ProtectedRoute requireAdmin>
                <Exams />
              </ProtectedRoute>
            } />
            <Route path="/admin/communication" element={
              <ProtectedRoute requireAdmin>
                <Communication />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute requireAdmin>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requireAdmin>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/gallery" element={
              <ProtectedRoute requireAdmin>
                <Gallery />
              </ProtectedRoute>
            } />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
