import { User } from '@supabase/supabase-js';
import { AllUsersPage } from '@/components/admin/AllUsersPage';
import { PendingBookings } from '@/components/admin/PendingBookings';
import { SeatChangeRequests } from '@/components/admin/SeatChangeRequests';
import { AdminTransactionsPage } from '@/components/admin/AdminTransactionsPage';
import { NoticeManagement } from '@/components/admin/NoticeManagement';
import { LibrarySettings } from '@/components/admin/LibrarySettings';
import { ExpiringMembershipsTable } from '@/components/admin/ExpiringMembershipsTable';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard = ({ user }: AdminDashboardProps) => {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#00B9F1] text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">अध्ययन Admin Panel</h1>
        <div className="text-sm">Welcome, {user.email}</div>
      </header>

      <div className="py-6 px-4">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid grid-cols-6 gap-1 bg-[#F0F9FF] rounded-lg p-1">
            <TabsTrigger value="users" className="data-[state=active]:bg-[#00B9F1] data-[state=active]:text-white rounded text-xs">Users</TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-[#00B9F1] data-[state=active]:text-white rounded text-xs">Pending</TabsTrigger>
            <TabsTrigger value="changes" className="data-[state=active]:bg-[#00B9F1] data-[state=active]:text-white rounded text-xs">Seat Changes</TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-[#00B9F1] data-[state=active]:text-white rounded text-xs">Transactions</TabsTrigger>
            <TabsTrigger value="notices" className="data-[state=active]:bg-[#00B9F1] data-[state=active]:text-white rounded text-xs">Notices</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#00B9F1] data-[state=active]:text-white rounded text-xs">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <h2 className="text-xl font-semibold text-[#333] mb-2">Registered Users</h2>
            <AllUsersPage />
            <h3 className="text-lg font-medium mt-6 mb-2">Expiring Memberships</h3>
            <ExpiringMembershipsTable />
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <h2 className="text-xl font-semibold text-[#333] mb-2">Pending Bookings</h2>
            <PendingBookings />
          </TabsContent>

          <TabsContent value="changes" className="mt-6">
            <h2 className="text-xl font-semibold text-[#333] mb-2">Seat Change Requests</h2>
            <SeatChangeRequests />
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <h2 className="text-xl font-semibold text-[#333] mb-2">All Transactions</h2>
            <AdminTransactionsPage />
          </TabsContent>

          <TabsContent value="notices" className="mt-6">
            <h2 className="text-xl font-semibold text-[#333] mb-2">Notices Management</h2>
            <NoticeManagement />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <h2 className="text-xl font-semibold text-[#333] mb-2">Library Settings</h2>
            <LibrarySettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
