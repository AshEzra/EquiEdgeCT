import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Waitlist from "./pages/Waitlist";
import ExpertMarketplace from "./pages/ExpertMarketplace";
import ExpertProfile from "./pages/ExpertProfile";
import Messages from "./pages/Messages";
import ManageProfile from "./pages/ManageProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import { UserProfileProvider } from "./contexts/UserProfileContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UserProfileProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/waitlist" element={<Waitlist />} />
              <Route path="/experts" element={
                <ProtectedRoute>
                  <ExpertMarketplace />
                </ProtectedRoute>
              } />
              <Route path="/expert/:id" element={
                <ProtectedRoute>
                  <ExpertProfile />
                </ProtectedRoute>
              } />
              <Route path="/messages" element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } />
              <Route path="/manage-profile" element={
                <ProtectedRoute>
                  <ManageProfile />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </UserProfileProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
