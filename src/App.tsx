import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/admin/Login";
import NotFound from "./pages/NotFound";

const Styleguide = lazy(() => import("./pages/Styleguide"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Students = lazy(() => import("./pages/admin/Students"));
const Payments = lazy(() => import("./pages/admin/Payments"));
const Financials = lazy(() => import("./pages/admin/Financials"));
const Receivables = lazy(() => import("./pages/admin/Receivables"));
const Expenses = lazy(() => import("./pages/admin/Expenses"));
const Courses = lazy(() => import("./pages/admin/Courses"));
const Exams = lazy(() => import("./pages/admin/Exams"));
const Communication = lazy(() => import("./pages/admin/Communication"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const Gallery = lazy(() => import("./pages/admin/Gallery"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
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
            <Route path="/admin/receivables" element={
              <ProtectedRoute requireAdmin>
                <Receivables />
              </ProtectedRoute>
            } />
            <Route path="/admin/expenses" element={
              <ProtectedRoute requireAdmin>
                <Expenses />
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
