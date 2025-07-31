import { Toaster as ShadToaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Import your admin pages

import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import PendingBookings from "@/components/admin/PendingBookings";
import AllTransactions from '@/components/admin/AdminTransactionsPage'
import SeatChangeRequests from '@/components/admin/SeatChangeRequests'
import ExpiringMemberships from '@/components/admin/ExpiringMemberships'
import AllBiometric from '@/components/admin/AllBiometric'
import AllUsers from '@/components/admin/AllUsersPage'
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ShadToaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* --- Admin Panel Routes --- */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/pending-bookings" element={<PendingBookings />} />
          <Route path="/admin/all-transactions" element={<AllTransactions />} />
          <Route path="/admin/biometrics" element={<AllBiometric />} />
          <Route path="/admin/all-users" element={<AllUsers />} />
          {/* --- 404 Catch-All, KEEP LAST! --- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
