
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RealtimeProvider } from "@/components/realtime/RealtimeProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";
import PatientDashboard from "./pages/PatientDashboard";
import PhysicianDashboard from "./pages/PhysicianDashboard";
import HospitalDashboard from "./pages/HospitalDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <RealtimeProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Protected Routes - Main dashboard URLs */}
              <Route 
                path="/patient" 
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <PatientDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/physician" 
                element={
                  <ProtectedRoute allowedRoles={['physician']}>
                    <PhysicianDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/hospital" 
                element={
                  <ProtectedRoute allowedRoles={['hospital_admin']}>
                    <HospitalDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/agent" 
                element={
                  <ProtectedRoute allowedRoles={['agent']}>
                    <AgentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Legacy dashboard URLs for backward compatibility */}
              <Route 
                path="/patient-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <PatientDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/physician-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['physician']}>
                    <PhysicianDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/hospital-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['hospital_admin']}>
                    <HospitalDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/agent-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['agent']}>
                    <AgentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </RealtimeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
