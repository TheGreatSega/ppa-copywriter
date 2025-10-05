import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PlatformLayout from "./components/PlatformLayout";
import GoogleAdsDashboard from "./pages/platforms/GoogleAdsDashboard";
import MetaDashboard from "./pages/platforms/MetaDashboard";
import XDashboard from "./pages/platforms/XDashboard";
import TikTokDashboard from "./pages/platforms/TikTokDashboard";
import NotFound from "./pages/NotFound";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <PlatformLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard/google-ads" replace />} />
              <Route path="google-ads" element={<GoogleAdsDashboard />} />
              <Route path="meta" element={<MetaDashboard />} />
              <Route path="x" element={<XDashboard />} />
              <Route path="tiktok" element={<TikTokDashboard />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;